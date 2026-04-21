/**
 * Shared scenario logic for the emergency-ops service (port 28080).
 *
 * Auth notes:
 *  - All endpoints require a valid Keycloak JWT (Bearer token).
 *  - User ID is extracted server-side from the JWT sub claim via SecurityUtils.
 *  - No X-User-Id header needed for emergency-ops.
 */

import http from 'k6/http';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
import { getToken, bearerHeaders, decodeUserId } from '../auth.js';
import { checkOk, readLatency, writeLatency, thinkTime, randomItem, jitterCoord } from '../helpers.js';

const BASE_URL  = __ENV.EMERGENCY_OPS_URL || 'http://localhost:28080';

const users     = new SharedArray('eo_users', () => JSON.parse(open('../data/users.json')));
const locations = new SharedArray('eo_locations', () => JSON.parse(open('../data/locations.json')));

let _token  = null;
let _userId = null;

function ensureAuth() {
  if (_token) return;
  const user = users[exec.vu.idInTest % users.length];
  _token  = getToken(user.username, user.password);
  _userId = decodeUserId(_token) || user.userId;
}

// ── Individual API calls ───────────────────────────────────────────────────────

export function getNearestSafeZones() {
  ensureAuth();
  const loc = randomItem(locations);
  const { lat, lng } = jitterCoord(loc.lat, loc.lng);
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/safe-zone-locator/safe-zones/nearest` +
    `?latitudeDegrees=${lat}&longitudeDegrees=${lng}&maxDistanceMeters=5000&maxNumberOfSafeZones=5`,
    {
      headers: bearerHeaders(_token),
      tags: { name: 'GET /safe-zone-locator/safe-zones/nearest' },
    }
  );
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /safe-zone-locator/safe-zones/nearest');
}

export function createEmergencyRequest() {
  ensureAuth();
  const loc = randomItem(locations);
  const { lat, lng } = jitterCoord(loc.lat, loc.lng);
  const payload = JSON.stringify({
    lastLatitudeDegrees:  lat,
    lastLongitudeDegrees: lng,
  });
  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/emergency-request-receiver/request`,
    payload,
    {
      headers: bearerHeaders(_token),
      tags: { name: 'POST /emergency-request-receiver/request' },
    }
  );
  writeLatency.add(Date.now() - start);
  checkOk(res, 'POST /emergency-request-receiver/request');
}

export function getMyEmergencyRequests() {
  ensureAuth();
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/emergency-request-receiver/requests?page=0&size=10`,
    {
      headers: bearerHeaders(_token),
      tags: { name: 'GET /emergency-request-receiver/requests' },
    }
  );
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /emergency-request-receiver/requests');
}

export function checkEmergencyAllowed() {
  ensureAuth();
  // Check against another test user
  const otherUser = users[(exec.vu.idInTest + 1) % users.length];
  const targetId  = otherUser.userId;
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/emergency-request-receiver/user/${targetId}/emergency-request-allowed`,
    {
      headers: bearerHeaders(_token),
      tags: { name: 'GET /emergency-request-receiver/user/:id/emergency-request-allowed' },
    }
  );
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /emergency-request-receiver/allowed');
}

// ── Composite journeys ─────────────────────────────────────────────────────────

/**
 * Read-heavy journey simulating a user browsing safe zones and checking
 * past requests. High proportion of tests should use this journey.
 */
export function safeZoneBrowseJourney() {
  getNearestSafeZones();
  thinkTime(1, 2);
  getMyEmergencyRequests();
  thinkTime(1, 2);
  checkEmergencyAllowed();
}

/**
 * Full journey: check safe zones, send emergency request, confirm it appears.
 * Simulates a real emergency scenario.
 */
export function emergencyRequestJourney() {
  getNearestSafeZones();
  thinkTime(0.5, 1);
  createEmergencyRequest();
  thinkTime(1, 2);
  getMyEmergencyRequests();
}
