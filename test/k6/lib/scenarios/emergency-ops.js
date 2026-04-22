/**
 * Shared scenario logic for the emergency-ops REST service (port 28080).
 *
 * Auth notes:
 *  - Two distinct Keycloak roles drive two separate token pools per VU:
 *      USER              → emergency-request-receiver, safe-zone-locator
 *      EMERGENCY-SERVICE → emergency-request-manager, emergency-responder, safe-zone-manager
 *  - User accounts come from data/users.json
 *  - Service accounts come from data/emergency-services.json (same {username,password,userId} shape)
 *  - User ID is extracted server-side from JWT sub; no extra header needed.
 *
 * Three composite scenarios for ~90% endpoint coverage:
 *   userEmergencyScenario          — citizen view: safe-zone lookup + request lifecycle
 *   serviceOperationsScenario      — operator view: location updates + request triage
 *   safeZoneManagementScenario     — operator view: safe-zone CRUD + tracked targets
 */

import http from 'k6/http';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
import { check } from 'k6';
import { getPublicToken, getRestrictedToken, bearerHeaders, decodeUserId } from '../auth.js';
import { checkOk, readLatency, writeLatency, thinkTime, randomItem, jitterCoord, errorRate } from '../helpers.js';

const BASE_URL = __ENV.EMERGENCY_OPS_URL || 'http://localhost:28080';

const users    = new SharedArray('eo_users',    () => JSON.parse(open('../data/users.json')));
const services = new SharedArray('eo_services', () => JSON.parse(open('../data/emergency-services.json')));
const locations = new SharedArray('eo_locations', () => JSON.parse(open('../data/locations.json')));

// Per-VU state (isolated JS runtime per VU — these are VU-local).
let _userToken    = null;
let _serviceToken = null;
let _userId       = null;

function ensureUserAuth() {
  if (_userToken) return;
  const user  = users[exec.vu.idInTest % users.length];
  _userToken  = getPublicToken(user.username, user.password);
  _userId     = decodeUserId(_userToken) || user.userId;
}

function ensureServiceAuth() {
  if (_serviceToken) return;
  const svc    = services[exec.vu.idInTest % services.length];
  _serviceToken = getRestrictedToken(svc.username, svc.password);
}

function userHeaders()    { return bearerHeaders(_userToken);    }
function serviceHeaders() { return bearerHeaders(_serviceToken); }

// ── Safe-zone locator (USER) ──────────────────────────────────────────────────

export function getNearestSafeZones() {
  ensureUserAuth();
  const loc = randomItem(locations);
  const { lat, lng } = jitterCoord(loc.lat, loc.lng);
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/safe-zone-locator/safe-zones/nearest` +
    `?latitudeDegrees=${lat}&longitudeDegrees=${lng}&maxDistanceMeters=5000&maxNumberOfSafeZones=5`,
    { headers: userHeaders(), tags: { name: 'GET /safe-zone-locator/safe-zones/nearest' } }
  );
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /safe-zone-locator/safe-zones/nearest');
}

// ── Emergency request receiver (USER) ─────────────────────────────────────────

export function createEmergencyRequest() {
  ensureUserAuth();
  const loc    = randomItem(locations);
  const { lat, lng } = jitterCoord(loc.lat, loc.lng);
  // targetId must be an EmergencyService UUID; use first seeded service account.
  const targetId = services[0].userId;
  const start  = Date.now();
  const res = http.post(
    `${BASE_URL}/emergency-request-receiver/request`,
    JSON.stringify({
      targetId,
      lastLatitudeDegrees:  lat,
      lastLongitudeDegrees: lng,
    }),
    { headers: userHeaders(), tags: { name: 'POST /emergency-request-receiver/request' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = checkOk(res, 'POST /emergency-request-receiver/request');
  if (ok && res.json('id')) return res.json('id');
  return null;
}

export function getMyEmergencyRequests() {
  ensureUserAuth();
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/emergency-request-receiver/requests?page=0&size=10`,
    { headers: userHeaders(), tags: { name: 'GET /emergency-request-receiver/requests' } }
  );
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /emergency-request-receiver/requests');
}

export function checkEmergencyAllowed() {
  ensureUserAuth();
  // Check eligibility against the first seeded emergency service.
  const targetId = services[0].userId;
  const start    = Date.now();
  const res = http.get(
    `${BASE_URL}/emergency-request-receiver/user/${targetId}/emergency-request-allowed`,
    { headers: userHeaders(), tags: { name: 'GET /emergency-request-receiver/user/:id/emergency-request-allowed' } }
  );
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /emergency-request-receiver/allowed');
}

// ── Emergency request manager (EMERGENCY-SERVICE) ────────────────────────────

export function updateServiceLocation() {
  ensureServiceAuth();
  const loc = randomItem(locations);
  const { lat, lng } = jitterCoord(loc.lat, loc.lng);
  const start = Date.now();
  const res = http.patch(
    `${BASE_URL}/emergency-request-manager/emergency-service/location`,
    JSON.stringify({ latitudeDegrees: lat, longitudeDegrees: lng }),
    { headers: serviceHeaders(), tags: { name: 'PATCH /emergency-request-manager/emergency-service/location' } }
  );
  writeLatency.add(Date.now() - start);
  checkOk(res, 'PATCH /emergency-request-manager/emergency-service/location');
}

export function getServiceLocation() {
  ensureServiceAuth();
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/emergency-request-manager/emergency-service/location`,
    { headers: serviceHeaders(), tags: { name: 'GET /emergency-request-manager/emergency-service/location' } }
  );
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /emergency-request-manager/emergency-service/location');
}

export function getRequestCount(status) {
  ensureServiceAuth();
  const qs    = status ? `?status=${status}` : '';
  const tag   = `GET /emergency-request-manager/requests/count${status ? `?status=${status}` : ''}`;
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/emergency-request-manager/requests/count${qs}`,
    { headers: serviceHeaders(), tags: { name: tag } }
  );
  readLatency.add(Date.now() - start);
  checkOk(res, tag);
}

/**
 * Returns the first item's id from the response, or null.
 * Pass status='PENDING'|'ACCEPTED'|'REJECTED'|'CLOSED' to filter.
 */
export function getServiceRequests(status) {
  ensureServiceAuth();
  const qs    = status ? `?status=${status}&page=0&size=5` : '?page=0&size=5';
  const tag   = `GET /emergency-request-manager/requests${status ? `?status=${status}` : ''}`;
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/emergency-request-manager/requests${qs}`,
    { headers: serviceHeaders(), tags: { name: tag } }
  );
  readLatency.add(Date.now() - start);
  const ok = checkOk(res, tag);
  if (ok) {
    const body  = res.json();
    const items = body && body.items;
    if (items && items.length > 0) return items[0].id;
  }
  return null;
}

/**
 * Accept a PENDING request. Concurrent VUs may race to accept the same request;
 * 4xx responses are treated as expected contention, not errors.
 */
export function acceptEmergencyRequest(requestId) {
  if (!requestId) return;
  ensureServiceAuth();
  const start = Date.now();
  const res = http.patch(
    `${BASE_URL}/emergency-request-manager/requests/${requestId}/accept`,
    null,
    { headers: serviceHeaders(), tags: { name: 'PATCH /emergency-request-manager/requests/:id/accept' } }
  );
  writeLatency.add(Date.now() - start);
  // Accept 2xx (success) or 4xx (concurrent conflict) as non-errors.
  const ok = check(res, { 'accept: not 5xx': (r) => r.status < 500 });
  errorRate.add(!ok);
}

/**
 * Reject a PENDING request. Same contention-tolerant check as accept.
 */
export function rejectEmergencyRequest(requestId) {
  if (!requestId) return;
  ensureServiceAuth();
  const start = Date.now();
  const res = http.patch(
    `${BASE_URL}/emergency-request-manager/requests/${requestId}/reject`,
    null,
    { headers: serviceHeaders(), tags: { name: 'PATCH /emergency-request-manager/requests/:id/reject' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'reject: not 5xx': (r) => r.status < 500 });
  errorRate.add(!ok);
}

/**
 * Close an ACCEPTED request. Same contention-tolerant check.
 */
export function closeEmergencyRequest(requestId) {
  if (!requestId) return;
  ensureServiceAuth();
  const start = Date.now();
  const res = http.patch(
    `${BASE_URL}/emergency-request-manager/requests/${requestId}/close`,
    null,
    { headers: serviceHeaders(), tags: { name: 'PATCH /emergency-request-manager/requests/:id/close' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = check(res, { 'close: not 5xx': (r) => r.status < 500 });
  errorRate.add(!ok);
}

// ── Emergency responder (EMERGENCY-SERVICE) ───────────────────────────────────

export function getServiceTargets() {
  ensureServiceAuth();
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/emergency-responder/targets?page=0&size=10`,
    { headers: serviceHeaders(), tags: { name: 'GET /emergency-responder/targets' } }
  );
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /emergency-responder/targets');
}

// ── Safe-zone manager (EMERGENCY-SERVICE) ─────────────────────────────────────

/**
 * Creates a safe zone and returns its UUID, or null on failure.
 */
export function createSafeZone() {
  ensureServiceAuth();
  const loc  = randomItem(locations);
  const { lat, lng } = jitterCoord(loc.lat, loc.lng);
  const name = `K6-Zone-VU${__VU}-${Date.now()}`;
  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/safe-zone-manager/safe-zone`,
    JSON.stringify({
      latitudeDegrees:  lat,
      longitudeDegrees: lng,
      name,
      radiusMeters: 200 + Math.floor(Math.random() * 800),
    }),
    { headers: serviceHeaders(), tags: { name: 'POST /safe-zone-manager/safe-zone' } }
  );
  writeLatency.add(Date.now() - start);
  const ok = checkOk(res, 'POST /safe-zone-manager/safe-zone');
  if (ok && res.json('id')) return res.json('id');
  return null;
}

export function listSafeZones(nameFilter) {
  ensureServiceAuth();
  const qs    = nameFilter ? `?nameFilter=${encodeURIComponent(nameFilter)}&page=0&size=10` : '?page=0&size=10';
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/safe-zone-manager/safe-zones${qs}`,
    { headers: serviceHeaders(), tags: { name: 'GET /safe-zone-manager/safe-zones' } }
  );
  readLatency.add(Date.now() - start);
  const ok = checkOk(res, 'GET /safe-zone-manager/safe-zones');
  if (ok) {
    const body  = res.json();
    const items = body && body.items;
    if (items && items.length > 0) return items[0].id;
  }
  return null;
}

export function updateSafeZone(safeZoneId) {
  if (!safeZoneId) return;
  ensureServiceAuth();
  const loc  = randomItem(locations);
  const { lat, lng } = jitterCoord(loc.lat, loc.lng);
  const start = Date.now();
  const res = http.put(
    `${BASE_URL}/safe-zone-manager/safe-zone/${safeZoneId}`,
    JSON.stringify({
      latitudeDegrees:  lat,
      longitudeDegrees: lng,
      radiusMeters: 300 + Math.floor(Math.random() * 500),
      name: `K6-Zone-Updated-VU${__VU}-${Date.now()}`,
    }),
    { headers: serviceHeaders(), tags: { name: 'PUT /safe-zone-manager/safe-zone/:id' } }
  );
  writeLatency.add(Date.now() - start);
  checkOk(res, 'PUT /safe-zone-manager/safe-zone/:id');
}

export function deleteSafeZone(safeZoneId) {
  if (!safeZoneId) return;
  ensureServiceAuth();
  const start = Date.now();
  const res = http.del(
    `${BASE_URL}/safe-zone-manager/safe-zone/${safeZoneId}`,
    null,
    { headers: serviceHeaders(), tags: { name: 'DELETE /safe-zone-manager/safe-zone/:id' } }
  );
  writeLatency.add(Date.now() - start);
  checkOk(res, 'DELETE /safe-zone-manager/safe-zone/:id');
}

// ── Scenario 1: User Emergency ────────────────────────────────────────────────
// Citizen-side hot path: locate safe zones → eligibility check → send request → review.
//
// Endpoints: GET /safe-zone-locator/safe-zones/nearest,
//            GET /emergency-request-receiver/user/:id/emergency-request-allowed,
//            POST /emergency-request-receiver/request,
//            GET /emergency-request-receiver/requests (×2 — before and after submit)
export function userEmergencyScenario() {
  // Pre-flight: find nearest safe zones and check if a request is allowed.
  getNearestSafeZones();
  thinkTime(0.5, 1);

  checkEmergencyAllowed();
  thinkTime(0.5, 1);

  getMyEmergencyRequests();
  thinkTime(0.5, 1);

  // Submit emergency request (infrequent — 1 in 3 iterations to avoid flooding).
  if (__ITER % 3 === 0) {
    createEmergencyRequest();
    thinkTime(1, 2);
    getMyEmergencyRequests();
  }

  // Follow-up safe-zone lookup (user may move to a new position).
  thinkTime(0.5, 1);
  getNearestSafeZones();
}

// ── Scenario 2: Service Operations ───────────────────────────────────────────
// Operator triage path: update GPS → count/list PENDING requests → accept → close.
//
// Endpoints: PATCH /emergency-request-manager/emergency-service/location,
//            GET  /emergency-request-manager/emergency-service/location,
//            GET  /emergency-request-manager/requests/count (all + PENDING + ACCEPTED),
//            GET  /emergency-request-manager/requests (PENDING + ACCEPTED),
//            PATCH /emergency-request-manager/requests/:id/accept,
//            PATCH /emergency-request-manager/requests/:id/close
export function serviceOperationsScenario() {
  updateServiceLocation();
  thinkTime(0.3, 0.7);

  getServiceLocation();
  thinkTime(0.3, 0.7);

  // Dashboard counts across all statuses.
  getRequestCount();
  thinkTime(0.2, 0.5);
  getRequestCount('PENDING');
  thinkTime(0.2, 0.5);
  getRequestCount('ACCEPTED');
  thinkTime(0.3, 0.7);

  // Triage: pick first PENDING → accept it.
  const pendingId = getServiceRequests('PENDING');
  thinkTime(0.5, 1);
  if (pendingId) {
    acceptEmergencyRequest(pendingId);
    thinkTime(0.5, 1);
  }

  // Review accepted queue → close first item.
  const acceptedId = getServiceRequests('ACCEPTED');
  thinkTime(0.5, 1);
  if (acceptedId) {
    closeEmergencyRequest(acceptedId);
    thinkTime(0.5, 1);
  }

  // Verify closed queue.
  getServiceRequests('CLOSED');
  thinkTime(0.3, 0.7);
  getRequestCount('CLOSED');
}

// ── Scenario 3: Safe-Zone Management ──────────────────────────────────────────
// Operator admin path: create safe zone → list → update → view targets → reject request → delete.
//
// Endpoints: POST /safe-zone-manager/safe-zone,
//            GET  /safe-zone-manager/safe-zones (plain + name-filtered),
//            PUT  /safe-zone-manager/safe-zone/:id,
//            DELETE /safe-zone-manager/safe-zone/:id,
//            GET  /emergency-responder/targets,
//            GET  /emergency-request-manager/requests (PENDING),
//            PATCH /emergency-request-manager/requests/:id/reject
export function safeZoneManagementScenario() {
  // Create a new safe zone and hold its id for update/delete.
  const newZoneId = createSafeZone();
  thinkTime(0.5, 1);

  // List all zones, then list with name filter.
  listSafeZones();
  thinkTime(0.3, 0.7);
  listSafeZones('K6');
  thinkTime(0.3, 0.7);

  // Update then delete the zone created above (cleanup keeps DB size bounded).
  if (newZoneId) {
    updateSafeZone(newZoneId);
    thinkTime(0.5, 1);
    deleteSafeZone(newZoneId);
    thinkTime(0.3, 0.7);
  }

  // Check tracked targets (read-only, exercises EmergencyResponderService).
  getServiceTargets();
  thinkTime(0.5, 1);

  // Reject a PENDING request — exercises the alternative request lifecycle path.
  const pendingId = getServiceRequests('PENDING');
  thinkTime(0.5, 1);
  if (pendingId) {
    rejectEmergencyRequest(pendingId);
    thinkTime(0.3, 0.7);
  }

  getServiceRequests('REJECTED');
  thinkTime(0.3, 0.5);
  getRequestCount('REJECTED');
}

// ── Legacy journeys (preserved for backward compatibility) ────────────────────

export function safeZoneBrowseJourney() {
  getNearestSafeZones();
  thinkTime(1, 2);
  getMyEmergencyRequests();
  thinkTime(1, 2);
  checkEmergencyAllowed();
}

export function emergencyRequestJourney() {
  getNearestSafeZones();
  thinkTime(0.5, 1);
  createEmergencyRequest();
  thinkTime(1, 2);
  getMyEmergencyRequests();
}
