/**
 * Shared scenario logic for the criminal-reports service (port 38080).
 *
 * Auth notes:
 *  - Public GET endpoints (heatmap, high-risk-check, report-viewer) need no token.
 *  - Protected POST/PUT/DELETE endpoints need:
 *      • Authorization: Bearer <jwt>   (Spring Security via KeycloakFilter)
 *      • X-User-Id: <uuid>             (extracted by controller directly from header)
 */

import http from 'k6/http';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
import { getRestrictedToken, bearerHeaders, decodeUserId } from '../auth.js';
import { checkOk, checkStatus, readLatency, writeLatency, thinkTime, randomItem, todayIso, daysAgoIso, jitterCoord } from '../helpers.js';

const BASE_URL  = __ENV.CRIMINAL_REPORTS_URL || 'http://localhost:38080';

const users     = new SharedArray('cr_users', () => JSON.parse(open('../data/reporters.json')));
const locations = new SharedArray('cr_locations', () => JSON.parse(open('../data/locations.json')));
const reports   = new SharedArray('cr_reports', () => JSON.parse(open('../data/reports.json')));

// Per-VU token cache — avoids re-authenticating on every iteration.
let _token  = null;
let _userId = null;

function ensureAuth() {
  if (_token) return;
  const user = users[exec.vu.idInTest % users.length];
  _token  = getRestrictedToken(user.username, user.password);
  _userId = decodeUserId(_token) || user.userId;
}

// ── Public read flows ──────────────────────────────────────────────────────────

export function viewPublicCrimeReports() {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/report-viewer/crime-reports?page=0&size=10`, {
    tags: { name: 'GET /report-viewer/crime-reports' },
  });
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /report-viewer/crime-reports');
}

export function viewPublicMissingPersonReports() {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/report-viewer/missing-person-reports?page=0&size=10`, {
    tags: { name: 'GET /report-viewer/missing-person-reports' },
  });
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /report-viewer/missing-person-reports');
}

export function getCrimeHeatmap() {
  const loc = randomItem(locations);
  const { lat, lng } = jitterCoord(loc.lat, loc.lng);
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/crime-locator/heatmap?latitude=${lat}&longitude=${lng}&radius=3000&page=0&size=20`,
    { tags: { name: 'GET /crime-locator/heatmap' } }
  );
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /crime-locator/heatmap');
}

export function checkHighRisk() {
  const loc = randomItem(locations);
  const { lat, lng } = jitterCoord(loc.lat, loc.lng);
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/crime-locator/high-risk-check?latitude=${lat}&longitude=${lng}`,
    { tags: { name: 'GET /crime-locator/high-risk-check' } }
  );
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /crime-locator/high-risk-check');
}

export function listCrimeReportsNearby() {
  const loc = randomItem(locations);
  const { lat, lng } = jitterCoord(loc.lat, loc.lng);
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/report-manager/crime-reports/nearby?latitude=${lat}&longitude=${lng}&radius=5000&page=0&size=10`,
    { tags: { name: 'GET /report-manager/crime-reports/nearby' } }
  );
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /report-manager/crime-reports/nearby');
}

// ── Authenticated write flows ──────────────────────────────────────────────────

export function createCrimeReport() {
  ensureAuth();
  const loc     = randomItem(locations);
  const { lat, lng } = jitterCoord(loc.lat, loc.lng);
  const template = randomItem(reports.crimeReports);
  const payload  = JSON.stringify({
    title:              `[K6-${__VU}] ${template.title}`,
    content:            template.content,
    severity:           template.severity,
    date:               daysAgoIso(Math.floor(Math.random() * 30)),
    latitude:           lat,
    longitude:          lng,
    numberOfVictims:    template.numberOfVictims,
    numberOfOffenders:  template.numberOfOffenders,
    arrested:           template.arrested,
    photos:             [],
  });
  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/report-manager/crime-reports`,
    payload,
    {
      headers: bearerHeaders(_token, { 'X-User-Id': _userId }),
      tags: { name: 'POST /report-manager/crime-reports' },
    }
  );
  writeLatency.add(Date.now() - start);
  checkOk(res, 'POST /report-manager/crime-reports');
  return res.status === 200 ? res.json('id') : null;
}

export function createMissingPersonReport() {
  ensureAuth();
  const loc      = randomItem(locations);
  const { lat, lng } = jitterCoord(loc.lat, loc.lng);
  const template = randomItem(reports.missingPersonReports);
  const payload  = JSON.stringify({
    title:        `[K6-${__VU}] ${template.title}`,
    fullName:     template.fullName,
    personalId:   `K6-${Date.now()}-${__VU}`,
    date:         daysAgoIso(Math.floor(Math.random() * 7)),
    content:      template.content,
    latitude:     lat,
    longitude:    lng,
    contactEmail: template.contactEmail,
    contactPhone: template.contactPhone,
  });
  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/report-manager/missing-person-reports`,
    payload,
    {
      headers: bearerHeaders(_token, { 'X-User-Id': _userId }),
      tags: { name: 'POST /report-manager/missing-person-reports' },
    }
  );
  writeLatency.add(Date.now() - start);
  checkOk(res, 'POST /report-manager/missing-person-reports');
  return res.status === 200 ? res.json('id') : null;
}

export function listMyCrimeReports() {
  ensureAuth();
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}/report-manager/crime-reports?page=0&size=10`,
    {
      headers: bearerHeaders(_token, { 'X-User-Id': _userId }),
      tags: { name: 'GET /report-manager/crime-reports' },
    }
  );
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /report-manager/crime-reports');
}

// ── Composite user journeys ────────────────────────────────────────────────────

/**
 * Light read-only journey — no authentication required.
 * Used by anonymous / browse scenarios.
 */
export function publicBrowseJourney() {
  viewPublicCrimeReports();
  thinkTime(0.5, 1.5);
  viewPublicMissingPersonReports();
  thinkTime(0.5, 1.5);
  getCrimeHeatmap();
  thinkTime(0.5, 1.5);
  checkHighRisk();
}

/**
 * Full authenticated journey: browse → create report → list own reports.
 */
export function authenticatedReporterJourney() {
  // Browse phase
  viewPublicCrimeReports();
  thinkTime(1, 2);
  getCrimeHeatmap();
  thinkTime(1, 2);

  // Write phase
  ensureAuth();
  if (Math.random() < 0.5) {
    createCrimeReport();
  } else {
    createMissingPersonReport();
  }
  thinkTime(1, 2);
  listMyCrimeReports();
}
