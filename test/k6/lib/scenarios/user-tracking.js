/**
 * Shared scenario logic for the user-tracking gRPC service (port 19090).
 *
 * k6 gRPC notes:
 *  - Proto files are loaded at init time via client.load().
 *  - Path is resolved relative to the working directory where k6 is invoked,
 *    NOT relative to this file. Set PROTO_PATH env var accordingly.
 *  - Run k6 from test/k6/ directory: `k6 run scripts/user-tracking/smoke.js`
 *  - JWT is sent as gRPC metadata: { authorization: 'Bearer <token>' }
 *
 * Requires k6 v0.49+ for grpc module.
 */

import grpc from 'k6/net/grpc';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
import { check } from 'k6';
import { getToken } from '../auth.js';
import { readLatency, writeLatency, thinkTime, randomItem, jitterCoord, errorRate } from '../helpers.js';

const HOST      = __ENV.USER_TRACKING_GRPC_HOST || 'localhost:19090';
const PROTO_DIR = __ENV.PROTO_PATH || '../../service/user-tracking/src/main/proto';

const users     = new SharedArray('ut_users', () => JSON.parse(open('../data/users.json')));
const locations = new SharedArray('ut_locations', () => JSON.parse(open('../data/locations.json')));

// ── gRPC client (must be declared at module scope) ────────────────────────────
export const client = new grpc.Client();
client.load([PROTO_DIR], 'tracker.proto', 'trackingmanager.proto', 'notifier.proto');

let _token = null;

function ensureAuth() {
  if (_token) return;
  const user = users[exec.vu.idInTest % users.length];
  _token = getToken(user.username, user.password);
}

function authMeta() {
  return _token ? { authorization: `Bearer ${_token}` } : {};
}

// ── Connection lifecycle ───────────────────────────────────────────────────────
// Call openConnection() in setup or at the start of each scenario function.
export function openConnection() {
  client.connect(HOST, { plaintext: true });
}

export function closeConnection() {
  client.close();
}

// ── Tracker service ───────────────────────────────────────────────────────────

export function updateUserLocation() {
  ensureAuth();
  const loc = randomItem(locations);
  const { lat, lng } = jitterCoord(loc.lat, loc.lng);
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.TrackerController/UpdateUserLocation',
    {
      locations: [
        {
          latitude_deg:   lat,
          longitude_deg:  lng,
          accuracy_meter: 10.0,
          velocity_mps:   0.0,
          timestamp_ms:   Date.now(),
        },
      ],
    },
    { metadata: authMeta(), tags: { name: 'grpc.UpdateUserLocation' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.UpdateUserLocation: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

export function listLocationHistory(familyCircleId) {
  ensureAuth();
  const user   = users[exec.vu.idInTest % users.length];
  const loc    = randomItem(locations);
  const start  = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.TrackerController/ListFamilyMemberLocationHistory',
    {
      family_circle_id:      familyCircleId || '00000000-0000-0000-0000-000000000099',
      member_id:             user.userId,
      center_latitude_deg:   loc.lat,
      center_longitude_deg:  loc.lng,
      radius_meter:          5000,
    },
    { metadata: authMeta(), tags: { name: 'grpc.ListFamilyMemberLocationHistory' } }
  );
  readLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.ListLocationHistory: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

// ── TrackingManager service ────────────────────────────────────────────────────

export function createFamilyCircle() {
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.TrackingManagerController/CreateFamilyCircle',
    {
      name:        `K6-Circle-${__VU}-${Date.now()}`,
      family_role: 'PARENT',
    },
    { metadata: authMeta(), tags: { name: 'grpc.CreateFamilyCircle' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.CreateFamilyCircle: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
  if (ok && res.message) return res.message.family_circle_id;
  return null;
}

export function listFamilyCircles() {
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.TrackingManagerController/ListFamilyCircles',
    { page_size: 10 },
    { metadata: authMeta(), tags: { name: 'grpc.ListFamilyCircles' } }
  );
  readLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.ListFamilyCircles: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);

  // Return first circle ID for chained calls
  if (ok && res.message && res.message.family_circles && res.message.family_circles.length > 0) {
    return res.message.family_circles[0].family_circle_id;
  }
  return null;
}

export function listFamilyCircleMembers(familyCircleId) {
  if (!familyCircleId) return;
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.TrackingManagerController/ListFamilyCircleMembers',
    { family_circle_id: familyCircleId },
    { metadata: authMeta(), tags: { name: 'grpc.ListFamilyCircleMembers' } }
  );
  readLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.ListFamilyCircleMembers: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

// ── Notifier service ───────────────────────────────────────────────────────────

export function countTrackingNotifications() {
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.NotifierController/CountTrackingNotifications',
    {},
    { metadata: authMeta(), tags: { name: 'grpc.CountTrackingNotifications' } }
  );
  readLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.CountTrackingNotifications: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

export function listTrackingNotifications() {
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.NotifierController/ListTrackingNotifications',
    { page_size: 10 },
    { metadata: authMeta(), tags: { name: 'grpc.ListTrackingNotifications' } }
  );
  readLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.ListTrackingNotifications: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

// ── Composite journeys ─────────────────────────────────────────────────────────

/**
 * Location update burst: push N location points then read history.
 * Simulates a mobile client updating GPS at regular intervals.
 */
export function locationUpdateJourney() {
  updateUserLocation();
  thinkTime(0.5, 1);
  updateUserLocation();
  thinkTime(0.5, 1);

  const circleId = listFamilyCircles();
  if (circleId) {
    thinkTime(0.5, 1);
    listLocationHistory(circleId);
  }
}

/**
 * Family circle management journey: list circles → view members → update location.
 */
export function familyCircleJourney() {
  const circleId = listFamilyCircles();
  thinkTime(1, 2);
  if (circleId) {
    listFamilyCircleMembers(circleId);
    thinkTime(1, 2);
  }
  updateUserLocation();
  thinkTime(0.5, 1);
  countTrackingNotifications();
}
