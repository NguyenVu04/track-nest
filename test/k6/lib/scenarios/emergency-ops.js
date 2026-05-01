// Shared scenario for emergency-ops HTTP performance tests.
// Run k6 from test/k6/:  k6 run scripts/emergency-ops/smoke.js
//
// Token lifetime note: Keycloak default access token lifespan is 5 minutes.
// For stress/spike tests (>5 min), increase Access Token Lifespan in the
// restricted-dev and public-dev realm settings before running.

import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

import { getEmergencyServiceTokens, getTokensForUsers } from '../auth.js';
import { USERS, pickRandom, thinkTime } from '../helpers.js';

// ── Seed data (matches 01-emergency-ops-seed.sql) ────────────────────────────
// 'admin' service (0e745cb3-...) is excluded from the test pool.

const EMERGENCY_SERVICES = [
  { id: '6c6ca52f-46b9-472b-8868-86ab2775b187', username: 'emgser1', lat: 10.778,  lon: 106.702  },
  { id: '2c57e800-b4e2-48ba-b43c-b61075530236', username: 'emgser2', lat: 21.0295, lon: 105.855  },
  { id: '168d6df2-21ef-4773-8a38-6fad42d527e9', username: 'emgser3', lat: 16.0482, lon: 108.2218 },
  { id: '7ed33501-bcf8-4944-b043-44b328a3a071', username: 'emgser4', lat: 16.4648, lon: 107.5918 },
  { id: '2077665d-ecaa-44f6-82ee-a721bf7785bd', username: 'emgser5', lat: 10.0462, lon: 105.7858 },
];

// emergency_service_tracks_user: service username → USERS index (user1-4 only;
// emgser5 tracks user5/admin which is excluded from the test user pool)
const SERVICE_TRACKS_USER_IDX = {
  emgser1: 0,
  emgser2: 1,
  emgser3: 2,
  emgser4: 3,
};

const REQUEST_STATUSES = ['PENDING', 'REJECTED', 'ACCEPTED', 'CLOSED'];

// ── Config ────────────────────────────────────────────────────────────────────

const EMERGENCY_SERVICE_USERNAMES = EMERGENCY_SERVICES.map(s => s.username);

const EMERGENCY_OPS_URL = __ENV.EMERGENCY_OPS_URL || 'https://api.tracknestapp.org/emergency-ops';

// ── Custom metrics ────────────────────────────────────────────────────────────

export const metrics = {
  safeZones:       { d: new Trend('eo_safe_zones_duration',       true), s: new Rate('eo_safe_zones_success') },
  requestCount:    { d: new Trend('eo_request_count_duration',    true), s: new Rate('eo_request_count_success') },
  requests:        { d: new Trend('eo_requests_duration',         true), s: new Rate('eo_requests_success') },
  trackerRequests: { d: new Trend('eo_tracker_requests_duration', true), s: new Rate('eo_tracker_requests_success') },
};

// ── Internal helpers ──────────────────────────────────────────────────────────

function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

function checkHttp(res, metric, label) {
  const ok = res.status === 200;
  check(res, { [`${label} status 200`]: () => ok });
  metric.s.add(ok ? 1 : 0);
  if (!ok) {
    const body = typeof res.body === 'string' ? res.body.slice(0, 200) : '';
    console.warn(`[${label}] HTTP ${res.status}: ${body}`);
  }
  return ok;
}

function get(url, params, metric, label) {
  const start = Date.now();
  const res   = http.get(url, params);
  metric.d.add(Date.now() - start);
  checkHttp(res, metric, label);
  return res;
}

// ── setup() ───────────────────────────────────────────────────────────────────

export function setup() {
  const emgTokens  = getEmergencyServiceTokens(EMERGENCY_SERVICE_USERNAMES);
  const userTokens = getTokensForUsers(USERS);

  for (const svc of EMERGENCY_SERVICES) {
    if (!emgTokens[svc.username]) {
      console.error(`[setup] no token for ${svc.username} — check KEYCLOAK_URL / restricted-dev realm`);
    }
  }
  for (const user of USERS) {
    if (!userTokens[user.username]) {
      console.error(`[setup] no token for ${user.username} — check KEYCLOAK_URL / public-dev realm`);
    }
  }

  return { emgTokens, userTokens };
}

// ── runIteration() ────────────────────────────────────────────────────────────

export function runIteration(data) {
  const svc      = pickRandom(EMERGENCY_SERVICES);
  const emgToken = data.emgTokens[svc.username];

  // Prefer the user tracked by this service; fall back to any non-admin user
  const trackedIdx = SERVICE_TRACKS_USER_IDX[svc.username];
  const user       = trackedIdx === undefined ? pickRandom(USERS) : USERS[trackedIdx];
  const userToken  = data.userTokens[user.username];

  if (!emgToken || !userToken) {
    console.warn('[VU] skipping iteration — missing token');
    return;
  }

  const emgAuth  = authHeader(emgToken);
  const userAuth = authHeader(userToken);

  // Randomise the optional status filter to spread load across query paths
  const status          = pickRandom([...REQUEST_STATUSES, null]);
  const statusSuffix    = status ? `?status=${status}` : '';
  const statusAmpSuffix = status ? `&status=${status}` : '';

  // 1. GET /safe-zone-manager/safe-zones — emergency service sees its own zones
  get(
    `${EMERGENCY_OPS_URL}/safe-zone-manager/safe-zones?page=0&size=10`,
    emgAuth,
    metrics.safeZones,
    'GetSafeZones',
  );

  // 2. GET /emergency-request-manager/requests/count — optionally filtered by status
  thinkTime(0.3, 1);
  get(
    `${EMERGENCY_OPS_URL}/emergency-request-manager/requests/count${statusSuffix}`,
    emgAuth,
    metrics.requestCount,
    'GetRequestCount',
  );

  // 3. GET /emergency-request-manager/requests — operator reads the list
  thinkTime(0.5, 1.5);
  get(
    `${EMERGENCY_OPS_URL}/emergency-request-manager/requests?page=0&size=10${statusAmpSuffix}`,
    emgAuth,
    metrics.requests,
    'GetRequests',
  );

  // 4. GET /emergency-request-receiver/requests — user checks their own requests
  thinkTime(0.5, 2);
  get(
    `${EMERGENCY_OPS_URL}/emergency-request-receiver/requests?page=0&size=10`,
    userAuth,
    metrics.trackerRequests,
    'GetTrackerRequests',
  );

  // Inter-iteration think time: operator acts on results before next cycle
  thinkTime(1, 3);
}

// ── makeHandleSummary() ───────────────────────────────────────────────────────

export function makeHandleSummary(scriptType) {
  return function handleSummary(data) {
    const ts       = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = `results/emergency-ops-${scriptType}-${ts}.json`;
    return {
      [jsonPath]: JSON.stringify(data, null, 2),
      stdout:     textSummary(data, { indent: ' ', enableColors: true }),
    };
  };
}
