/**
 * Shared k6 helpers: response checks, random data pickers, sleep utilities.
 */

import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ── Custom metrics (import in scripts that need them) ─────────────────────────

export const errorRate    = new Rate('custom_error_rate');
export const writeLatency = new Trend('custom_write_latency_ms', true);
export const readLatency  = new Trend('custom_read_latency_ms', true);

// ── Response checks ────────────────────────────────────────────────────────────

export function checkOk(res, tag) {
  const ok = check(res, {
    [`${tag}: status 2xx`]: (r) => r.status >= 200 && r.status < 300,
  });
  errorRate.add(!ok);
  return ok;
}

export function checkStatus(res, expected, tag) {
  const ok = check(res, {
    [`${tag}: status ${expected}`]: (r) => r.status === expected,
  });
  errorRate.add(!ok);
  return ok;
}

export function checkJson(res, tag) {
  const ok = check(res, {
    [`${tag}: body is JSON`]: (r) => {
      try { JSON.parse(r.body); return true; } catch (_) { return false; }
    },
  });
  return ok;
}

// ── Sleep helpers ──────────────────────────────────────────────────────────────

/** Pause between think-time (1–3 s by default). */
export function thinkTime(minSec = 1, maxSec = 3) {
  sleep(minSec + Math.random() * (maxSec - minSec));
}

// ── Data helpers ───────────────────────────────────────────────────────────────

/** Pick a random element from an array. */
export function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Return today's date as an ISO local-date string (YYYY-MM-DD). */
export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Return a date N days ago as ISO local-date string. */
export function daysAgoIso(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Add small Gaussian-like jitter to a coordinate (±~50 m at equator). */
export function jitterCoord(lat, lng, maxDeltaDeg = 0.0005) {
  return {
    lat: lat + (Math.random() * 2 - 1) * maxDeltaDeg,
    lng: lng + (Math.random() * 2 - 1) * maxDeltaDeg,
  };
}
