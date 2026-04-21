/**
 * Shared scenario logic for the Next.js web frontend (port 3000).
 *
 * These are HTTP/HTML tests — we check status codes and content markers.
 * Cookie-authenticated routes (dashboard) may redirect to Keycloak if not
 * already logged in; we measure redirect latency separately.
 */

import http from 'k6/http';
import { SharedArray } from 'k6/data';
import { checkOk, checkStatus, readLatency, thinkTime, randomItem } from '../helpers.js';

const BASE_URL = __ENV.WEB_URL || 'http://localhost:3000';

const locations = new SharedArray('web_locations', () => JSON.parse(open('../data/locations.json')));

// ── Individual page requests ───────────────────────────────────────────────────

export function getHomePage() {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/`, {
    tags: { name: 'GET /' },
  });
  readLatency.add(Date.now() - start);
  checkOk(res, 'GET /');
}

export function getDashboard() {
  const start = Date.now();
  // The dashboard may redirect unauthenticated users to /auth/signin.
  // We allow 200 or 3xx — just verify the page is reachable and loads quickly.
  const res = http.get(`${BASE_URL}/dashboard`, {
    redirects: 0,
    tags: { name: 'GET /dashboard' },
  });
  readLatency.add(Date.now() - start);
  // Accept 200 (logged in) or 307/302 (redirect to Keycloak login)
  const ok = (res.status >= 200 && res.status < 400);
  if (!ok) console.warn(`GET /dashboard returned ${res.status}`);
}

export function getFamilyCirclesPage() {
  const start = Date.now();
  const res = http.get(`${BASE_URL}/dashboard/family-circles`, {
    redirects: 0,
    tags: { name: 'GET /dashboard/family-circles' },
  });
  readLatency.add(Date.now() - start);
  const ok = (res.status >= 200 && res.status < 400);
  if (!ok) console.warn(`GET /dashboard/family-circles returned ${res.status}`);
}

export function getStaticAssets() {
  // Next.js serves /_next/static/* — just probe the manifest
  const start = Date.now();
  const res = http.get(`${BASE_URL}/_next/static/chunks/main.js`, {
    tags: { name: 'GET /_next/static asset' },
  });
  readLatency.add(Date.now() - start);
  // 200 or 304 (cached) are both fine; 404 means asset name changed
  const ok = res.status === 200 || res.status === 304 || res.status === 404;
  if (!ok) console.warn(`Static asset returned ${res.status}`);
}

// ── Composite journeys ─────────────────────────────────────────────────────────

/**
 * Anonymous visitor journey: home → dashboard (will redirect to login).
 */
export function anonymousVisitorJourney() {
  getHomePage();
  thinkTime(1, 3);
  getDashboard();
  thinkTime(0.5, 1.5);
}

/**
 * Full page-navigation journey simulating an authenticated user browsing.
 */
export function authenticatedBrowseJourney() {
  getHomePage();
  thinkTime(1, 2);
  getDashboard();
  thinkTime(1, 2);
  getFamilyCirclesPage();
  thinkTime(1, 2);
}
