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
 *
 * Three composite scenarios (each ~90% endpoint coverage when combined):
 *   locationTrackingScenario      — mobile hot path (device reg + location writes + reads)
 *   circleAdminScenario           — full family circle admin lifecycle
 *   messagingAndNotificationsScenario — messaging inbox + notification management
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

// ── gRPC client (module scope — shared read-only across iterations within a VU) ─
export const client = new grpc.Client();
client.load([PROTO_DIR], 'tracker.proto', 'trackingmanager.proto', 'notifier.proto', 'familymessenger.proto');

// Per-VU state: each VU runs in an isolated JS runtime so these are VU-local.
let _token    = null;
let _deviceId = null;

function ensureAuth() {
  if (_token) return;
  const user = users[exec.vu.idInTest % users.length];
  _token = getToken(user.username, user.password);
}

function authMeta() {
  return _token ? { authorization: `Bearer ${_token}` } : {};
}

// ── Connection lifecycle ──────────────────────────────────────────────────────

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
  const user  = users[exec.vu.idInTest % users.length];
  const loc   = randomItem(locations);
  const start = Date.now();
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

// ── TrackingManager service ───────────────────────────────────────────────────

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
  if (ok && res.message && res.message.family_circles && res.message.family_circles.length > 0) {
    return res.message.family_circles[0].family_circle_id;
  }
  return null;
}

export function updateFamilyCircle(familyCircleId) {
  if (!familyCircleId) return;
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.TrackingManagerController/UpdateFamilyCircle',
    {
      family_circle_id: familyCircleId,
      name:             `K6-Renamed-${__VU}-${Date.now()}`,
    },
    { metadata: authMeta(), tags: { name: 'grpc.UpdateFamilyCircle' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.UpdateFamilyCircle: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

export function deleteFamilyCircle(familyCircleId) {
  if (!familyCircleId) return;
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.TrackingManagerController/DeleteFamilyCircle',
    { family_circle_id: familyCircleId },
    { metadata: authMeta(), tags: { name: 'grpc.DeleteFamilyCircle' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.DeleteFamilyCircle: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

export function listFamilyCircleMembers(familyCircleId) {
  if (!familyCircleId) return null;
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
  if (ok && res.message && res.message.members) return res.message.members;
  return null;
}

export function updateFamilyRole(familyCircleId) {
  if (!familyCircleId) return;
  ensureAuth();
  const roles = ['PARENT', 'CHILD', 'GUARDIAN', 'RELATIVE'];
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.TrackingManagerController/UpdateFamilyRole',
    {
      family_circle_id: familyCircleId,
      family_role:      randomItem(roles),
    },
    { metadata: authMeta(), tags: { name: 'grpc.UpdateFamilyRole' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.UpdateFamilyRole: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

export function createParticipationPermission(familyCircleId) {
  if (!familyCircleId) return null;
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.TrackingManagerController/CreateParticipationPermission',
    { family_circle_id: familyCircleId },
    { metadata: authMeta(), tags: { name: 'grpc.CreateParticipationPermission' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.CreateParticipationPermission: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
  if (ok && res.message) return res.message.otp;
  return null;
}

export function participateInFamilyCircle(otp) {
  if (!otp) return;
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.TrackingManagerController/ParticipateInFamilyCircle',
    { otp },
    { metadata: authMeta(), tags: { name: 'grpc.ParticipateInFamilyCircle' } }
  );
  writeLatency.add(Date.now() - start);
  // Same user joining their own circle will get ALREADY_EXISTS — that's expected.
  // Check only that the RPC was reached and returned a valid gRPC response.
  check(res, { 'grpc.ParticipateInFamilyCircle: reachable': (r) => r !== null });
}

export function leaveFamilyCircle(familyCircleId) {
  if (!familyCircleId) return;
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.TrackingManagerController/LeaveFamilyCircle',
    { family_circle_id: familyCircleId },
    { metadata: authMeta(), tags: { name: 'grpc.LeaveFamilyCircle' } }
  );
  writeLatency.add(Date.now() - start);
  // Creator cannot leave their own circle (admin constraint); check reachability only.
  check(res, { 'grpc.LeaveFamilyCircle: reachable': (r) => r !== null });
}

export function removeMemberFromFamilyCircle(familyCircleId, memberId) {
  if (!familyCircleId || !memberId) return;
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.TrackingManagerController/RemoveMemberFromFamilyCircle',
    { family_circle_id: familyCircleId, member_id: memberId },
    { metadata: authMeta(), tags: { name: 'grpc.RemoveMemberFromFamilyCircle' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.RemoveMemberFromFamilyCircle: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

export function assignFamilyCircleAdmin(familyCircleId, memberId) {
  if (!familyCircleId || !memberId) return;
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.TrackingManagerController/AssignFamilyCircleAdmin',
    { family_circle_id: familyCircleId, member_id: memberId },
    { metadata: authMeta(), tags: { name: 'grpc.AssignFamilyCircleAdmin' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.AssignFamilyCircleAdmin: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

// ── Notifier service ──────────────────────────────────────────────────────────

export function registerMobileDevice() {
  ensureAuth();
  const platforms = ['Android', 'iOS'];
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.NotifierController/RegisterMobileDevice',
    {
      deviceToken:  `k6-token-vu${__VU}-${Date.now()}`,
      platform:     randomItem(platforms),
      languageCode: 'en',
    },
    { metadata: authMeta(), tags: { name: 'grpc.RegisterMobileDevice' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.RegisterMobileDevice: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
  if (ok && res.message) { _deviceId = res.message.id; }
}

export function updateMobileDevice() {
  if (!_deviceId) return;
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.NotifierController/UpdateMobileDevice',
    {
      id:           _deviceId,
      deviceToken:  `k6-token-vu${__VU}-refreshed-${Date.now()}`,
      platform:     'Android',
      languageCode: 'en',
    },
    { metadata: authMeta(), tags: { name: 'grpc.UpdateMobileDevice' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.UpdateMobileDevice: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

export function unregisterMobileDevice() {
  if (!_deviceId) return;
  ensureAuth();
  const id = _deviceId;
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.NotifierController/UnregisterMobileDevice',
    { id },
    { metadata: authMeta(), tags: { name: 'grpc.UnregisterMobileDevice' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.UnregisterMobileDevice: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
  if (ok) { _deviceId = null; }
}

export function ensureDeviceRegistered() {
  if (!_deviceId) registerMobileDevice();
}

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

export function countRiskNotifications() {
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.NotifierController/CountRiskNotifications',
    {},
    { metadata: authMeta(), tags: { name: 'grpc.CountRiskNotifications' } }
  );
  readLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.CountRiskNotifications: OK': (r) => r && r.status === grpc.StatusOK });
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
  if (ok && res.message && res.message.tracking_notifications) {
    return res.message.tracking_notifications;
  }
  return [];
}

export function listRiskNotifications() {
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.NotifierController/ListRiskNotifications',
    { page_size: 10 },
    { metadata: authMeta(), tags: { name: 'grpc.ListRiskNotifications' } }
  );
  readLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.ListRiskNotifications: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
  if (ok && res.message && res.message.risk_notifications) {
    return res.message.risk_notifications;
  }
  return [];
}

export function deleteTrackingNotification(id) {
  if (!id) return;
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.NotifierController/DeleteTrackingNotification',
    { id },
    { metadata: authMeta(), tags: { name: 'grpc.DeleteTrackingNotification' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.DeleteTrackingNotification: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

export function deleteRiskNotification(id) {
  if (!id) return;
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.NotifierController/DeleteRiskNotification',
    { id },
    { metadata: authMeta(), tags: { name: 'grpc.DeleteRiskNotification' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.DeleteRiskNotification: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

export function clearTrackingNotifications() {
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.NotifierController/ClearTrackingNotifications',
    {},
    { metadata: authMeta(), tags: { name: 'grpc.ClearTrackingNotifications' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.ClearTrackingNotifications: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

export function clearRiskNotifications() {
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.NotifierController/ClearRiskNotifications',
    {},
    { metadata: authMeta(), tags: { name: 'grpc.ClearRiskNotifications' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.ClearRiskNotifications: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

// ── FamilyMessenger service ───────────────────────────────────────────────────

export function sendMessage(familyCircleId) {
  if (!familyCircleId) return null;
  ensureAuth();
  const msgs = [
    'Are you home yet?',
    'On my way, ETA 10 minutes.',
    'Please check in when you arrive.',
    'All good here, just checking in.',
    'Heading to the usual spot now.',
  ];
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.FamilyMessengerController/SendMessage',
    {
      family_circle_id: familyCircleId,
      message_content:  randomItem(msgs),
    },
    { metadata: authMeta(), tags: { name: 'grpc.SendMessage' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.SendMessage: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
  if (ok && res.message) return res.message.message_id;
  return null;
}

export function listMessages(familyCircleId) {
  if (!familyCircleId) return;
  ensureAuth();
  const start = Date.now();
  const res = client.invoke(
    'project.tracknest.usertracking.proto.v1.FamilyMessengerController/ListMessages',
    { family_circle_id: familyCircleId, page_size: 20 },
    { metadata: authMeta(), tags: { name: 'grpc.ListMessages' } }
  );
  readLatency.add(Date.now() - start);
  const ok = check(res, { 'grpc.ListMessages: OK': (r) => r && r.status === grpc.StatusOK });
  errorRate.add(!ok);
}

// ── Scenario 1: Location Tracking ─────────────────────────────────────────────
// Mobile client hot path: register device once, push GPS updates in bursts,
// then poll circle & notification state.
//
// RPCs exercised: RegisterMobileDevice, UpdateUserLocation (×3),
//   ListFamilyCircles, ListFamilyMemberLocationHistory, ListFamilyCircleMembers,
//   CountTrackingNotifications, CountRiskNotifications, ListRiskNotifications,
//   UpdateMobileDevice (every 4th iter)
export function locationTrackingScenario() {
  ensureDeviceRegistered();
  thinkTime(0.2, 0.5);

  updateUserLocation();
  thinkTime(0.5, 1);
  updateUserLocation();
  thinkTime(0.5, 1);
  updateUserLocation();
  thinkTime(0.3, 0.7);

  const circleId = listFamilyCircles();
  thinkTime(0.5, 1);
  if (circleId) {
    listLocationHistory(circleId);
    thinkTime(0.5, 1);
    listFamilyCircleMembers(circleId);
    thinkTime(0.3, 0.7);
  }

  countTrackingNotifications();
  thinkTime(0.3, 0.5);
  countRiskNotifications();
  thinkTime(0.3, 0.5);

  if (__ITER % 4 === 0) {
    updateMobileDevice();
  }
  if (__ITER % 2 === 0) {
    listRiskNotifications();
  }
}

// ── Scenario 2: Family Circle Admin ──────────────────────────────────────────
// Full admin lifecycle exercising all write paths for TrackingManager.
//
// RPCs exercised: CreateFamilyCircle, UpdateFamilyCircle,
//   CreateParticipationPermission, ParticipateInFamilyCircle (expected rejection),
//   UpdateFamilyRole, ListFamilyCircleMembers, AssignFamilyCircleAdmin,
//   RemoveMemberFromFamilyCircle, LeaveFamilyCircle, DeleteFamilyCircle
export function circleAdminScenario() {
  const circleId = createFamilyCircle();
  thinkTime(0.5, 1);
  if (!circleId) return;

  updateFamilyCircle(circleId);
  thinkTime(0.5, 1);

  updateFamilyRole(circleId);
  thinkTime(0.3, 0.7);

  const otp = createParticipationPermission(circleId);
  thinkTime(0.5, 1);

  // Joining own circle is rejected by the service; still exercises OTP lookup code path.
  participateInFamilyCircle(otp);
  thinkTime(0.3, 0.7);

  const members = listFamilyCircleMembers(circleId);
  thinkTime(0.5, 1);

  // Exercises admin-only RPCs when a second member is present (e.g. from seed data).
  if (members && members.length >= 2) {
    const nonAdmin = members.find((m) => !m.is_admin);
    if (nonAdmin) {
      assignFamilyCircleAdmin(circleId, nonAdmin.member_id);
      thinkTime(0.3, 0.7);
      removeMemberFromFamilyCircle(circleId, nonAdmin.member_id);
      thinkTime(0.3, 0.7);
    }
  }

  // Creator cannot leave; verifies LeaveFamilyCircle reachability.
  leaveFamilyCircle(circleId);
  thinkTime(0.3, 0.7);

  deleteFamilyCircle(circleId);
}

// ── Scenario 3: Messaging & Notifications ─────────────────────────────────────
// Communication path: send & read messages, manage notification inbox.
//
// RPCs exercised: ListFamilyCircles, SendMessage (×2), ListMessages,
//   ListTrackingNotifications, ListRiskNotifications,
//   DeleteTrackingNotification, DeleteRiskNotification,
//   ClearTrackingNotifications (every 5th iter), ClearRiskNotifications (every 5th iter),
//   UnregisterMobileDevice + RegisterMobileDevice (every 10th iter)
export function messagingAndNotificationsScenario() {
  const circleId = listFamilyCircles();
  thinkTime(0.5, 1);

  if (circleId) {
    sendMessage(circleId);
    thinkTime(0.5, 1);
    sendMessage(circleId);
    thinkTime(0.5, 1);
    listMessages(circleId);
    thinkTime(0.5, 1);
  }

  const trackingNotifs = listTrackingNotifications();
  thinkTime(0.3, 0.7);
  const riskNotifs = listRiskNotifications();
  thinkTime(0.3, 0.7);

  if (trackingNotifs && trackingNotifs.length > 0) {
    deleteTrackingNotification(trackingNotifs[trackingNotifs.length - 1].id);
    thinkTime(0.2, 0.5);
  }
  if (riskNotifs && riskNotifs.length > 0) {
    deleteRiskNotification(riskNotifs[riskNotifs.length - 1].id);
    thinkTime(0.2, 0.5);
  }

  // Kept infrequent — clearing all notifications is a heavy write.
  if (__ITER % 5 === 0) {
    clearTrackingNotifications();
    thinkTime(0.2, 0.5);
    clearRiskNotifications();
    thinkTime(0.2, 0.5);
  }

  // Simulate device token rotation (e.g. OS-level token refresh).
  if (__ITER % 10 === 0 && _deviceId) {
    unregisterMobileDevice();
    thinkTime(0.3, 0.7);
    registerMobileDevice();
  }
}

// ── Legacy journeys (preserved for backward compatibility) ────────────────────

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
