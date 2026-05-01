// Shared scenario implementation for user-tracking gRPC performance tests.
// Run k6 from the test/k6/ directory:  k6 run scripts/user-tracking/smoke.js

import grpc    from 'k6/net/grpc';
import { Trend, Rate } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

import { getUserToken } from '../auth.js';
import {
  USERS, USER_CIRCLES, CIRCLES,
  pickRandom, jitter, pickPeerInCircle, checkGrpcOk, thinkTime,
} from '../helpers.js';

// Per-VU token cache — each VU has its own JS context so these are not shared
const TOKEN_REFRESH_INTERVAL_MS = 4 * 60 * 1000; // refresh 1 min before typical 5-min expiry
let _vuToken = null;
let _vuTokenFetchedAt = 0;
let _vuUser = null;

function getOrRefreshToken() {
  const now = Date.now();
  if (!_vuToken || (now - _vuTokenFetchedAt) >= TOKEN_REFRESH_INTERVAL_MS) {
    // Pin each VU to a stable user so tokens map 1:1 to Keycloak users
    if (!_vuUser) {
      _vuUser = USERS[(__VU - 1) % USERS.length];
    }
    _vuToken = getUserToken(_vuUser.username);
    _vuTokenFetchedAt = now;
    if (!_vuToken) {
      console.error(`[VU ${__VU}] token refresh failed for ${_vuUser.username}`);
    }
  }
  return { token: _vuToken, user: _vuUser };
}

// ── gRPC client (init context) ────────────────────────────────────────────────
// Proto files and their import paths are resolved relative to the CWD where
// k6 is invoked (expected: test/k6/).
export const client = new grpc.Client();
client.load(
  ['../../proto'],
  'familymessenger.proto',
  'notifier.proto',
  'tracker.proto',
  'trackingmanager.proto',
);

const GRPC_HOST    = __ENV.GRPC_HOST    || 'api.tracknestapp.org';
const GRPC_PORT    = __ENV.GRPC_PORT    || '443';
const GRPC_ADDRESS = `${GRPC_HOST}:${GRPC_PORT}`;

// ── Custom metrics (one Trend + one Rate per RPC) ─────────────────────────────
export const metrics = {
  sendMessage:               { d: new Trend('rpc_send_message_duration',                   true), s: new Rate('rpc_send_message_success') },
  listMessages:              { d: new Trend('rpc_list_messages_duration',                  true), s: new Rate('rpc_list_messages_success') },
  listTrackingNotifications: { d: new Trend('rpc_list_tracking_notifications_duration',    true), s: new Rate('rpc_list_tracking_notifications_success') },
  listRiskNotifications:     { d: new Trend('rpc_list_risk_notifications_duration',        true), s: new Rate('rpc_list_risk_notifications_success') },
  updateLocation:            { d: new Trend('rpc_update_location_duration',                true), s: new Rate('rpc_update_location_success') },
  listLocationHistory:       { d: new Trend('rpc_list_location_history_duration',          true), s: new Rate('rpc_list_location_history_success') },
  listFamilyCircles:         { d: new Trend('rpc_list_family_circles_duration',            true), s: new Rate('rpc_list_family_circles_success') },
};

// ── gRPC method names ─────────────────────────────────────────────────────────
const PKG = 'project.tracknest.usertracking.proto.v1';
const M = {
  sendMessage:               `${PKG}.FamilyMessengerController/SendMessage`,
  listMessages:              `${PKG}.FamilyMessengerController/ListMessages`,
  listTrackingNotifications: `${PKG}.NotifierController/ListTrackingNotifications`,
  listRiskNotifications:     `${PKG}.NotifierController/ListRiskNotifications`,
  updateLocation:            `${PKG}.TrackerController/UpdateUserLocation`,
  listLocationHistory:       `${PKG}.TrackerController/ListFamilyMemberLocationHistory`,
  listFamilyCircles:         `${PKG}.TrackingManagerController/ListFamilyCircles`,
};

// ── setup() ───────────────────────────────────────────────────────────────────
// Validates that at least one user token is reachable before VUs start.
export function setup() {
  const probe = getUserToken(USERS[0].username);
  if (!probe) {
    console.error(`[setup] could not obtain token for ${USERS[0].username} — check KEYCLOAK_URL`);
  }
  return {};
}

// ── Helper: invoke with timing ────────────────────────────────────────────────
function invoke(method, payload, meta, metric, label, username) {
  const start = Date.now();
  const res   = client.invoke(method, payload, meta);
  metric.d.add(Date.now() - start);
  checkGrpcOk(res, metric.s, `${label} [${username}]`);
  return res;
}

// ── runIteration() ────────────────────────────────────────────────────────────
// Main VU body — called by each script's default() export.
export function runIteration(_data) {
  const { token, user } = getOrRefreshToken();

  if (!token) {
    console.warn(`[VU ${__VU}] skipping iteration — token unavailable for ${user.username}`);
    return;
  }

  const userIdx = USERS.indexOf(user);
  const meta = { metadata: { authorization: `Bearer ${token}` } };

  client.connect(GRPC_ADDRESS, { plaintext: false });

  try {
    const circleId = pickRandom(USER_CIRCLES[userIdx]);
    const peer     = pickPeerInCircle(circleId, userIdx);

    // 1. UpdateUserLocation — write path, most latency-sensitive
    invoke(M.updateLocation, {
      locations: [{
        latitude_deg:   jitter(user.lat, 0.002),
        longitude_deg:  jitter(user.lon, 0.002),
        accuracy_meter: 5.0 + Math.random() * 5,
        velocity_mps:   Math.random() * 3,
        timestamp_ms:   Date.now(),
      }],
    }, meta, metrics.updateLocation, 'UpdateUserLocation', user.username);

    // 2. SendMessage — user composes and sends a message
    thinkTime(1, 2);
    invoke(M.sendMessage, {
      family_circle_id: circleId,
      message_content:  `k6 load test @ ${Date.now()}`,
    }, meta, metrics.sendMessage, 'SendMessage', user.username);

    // 3. ListMessages — user reads conversation
    thinkTime(1, 2);
    invoke(M.listMessages, {
      family_circle_id: circleId,
      page_size:        10,
    }, meta, metrics.listMessages, 'ListMessages', user.username);

    // 4. ListTrackingNotifications — user checks tracking alerts
    thinkTime(1, 2);
    invoke(M.listTrackingNotifications, {
      page_size: 10,
    }, meta, metrics.listTrackingNotifications, 'ListTrackingNotifications', user.username);

    // 5. ListRiskNotifications — user checks risk alerts
    thinkTime(1, 2);
    invoke(M.listRiskNotifications, {
      page_size: 10,
    }, meta, metrics.listRiskNotifications, 'ListRiskNotifications', user.username);

    // 6. ListFamilyMemberLocationHistory — user views a member's route
    thinkTime(1, 2);
    invoke(M.listLocationHistory, {
      family_circle_id: circleId,
      member_id:        peer.id,
    }, meta, metrics.listLocationHistory, 'ListFamilyMemberLocationHistory', user.username);

    // 7. ListFamilyCircles — user browses circle list
    thinkTime(1, 2);
    invoke(M.listFamilyCircles, {
      page_size: 10,
    }, meta, metrics.listFamilyCircles, 'ListFamilyCircles', user.username);

  } finally {
    client.close();
  }

  // Inter-iteration think time: user switches context before next action cycle
  thinkTime(1, 2);
}

// ── makeHandleSummary() ───────────────────────────────────────────────────────
// Returns a handleSummary function that writes a timestamped JSON file.
export function makeHandleSummary(scriptType) {
  return function handleSummary(data) {
    const ts       = new Date().toISOString().replaceAll(/[:.]/g, '-');
    const jsonPath = `results/user-tracking-${scriptType}-${ts}.json`;
    return {
      [jsonPath]: JSON.stringify(data, null, 2),
      stdout:     textSummary(data, { indent: ' ', enableColors: true }),
    };
  };
}
