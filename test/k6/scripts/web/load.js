/**
 * Load test — Next.js web frontend
 *
 * Purpose : Validate SSR/page rendering performance under concurrent user
 *           load. Tests both anonymous page loads (fast, cached by Nginx)
 *           and authenticated navigations (SSR, Keycloak redirect overhead).
 * Load    : 0 → 60 VUs over 1 min, hold 3 min, ramp down 1 min.
 * Pass    : p(95) < 1 s for all pages, error rate < 1 %
 *
 * Run:
 *   k6 run --env-file .env scripts/web/load.js
 */

import {
  anonymousVisitorJourney,
  authenticatedBrowseJourney,
  getHomePage,
  getDashboard,
  getFamilyCirclesPage,
} from '../../lib/scenarios/web.js';
import { thinkTime } from '../../lib/helpers.js';

export const options = {
  stages: [
    { duration: '1m', target: 60 },
    { duration: '3m', target: 60 },
    { duration: '1m', target: 0  },
  ],

  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    'http_req_duration{name:GET /}':                          ['p(95)<800'],
    'http_req_duration{name:GET /dashboard}':                 ['p(95)<1000'],
    'http_req_duration{name:GET /dashboard/family-circles}':  ['p(95)<1000'],
    custom_error_rate:       ['rate<0.01'],
    custom_read_latency_ms:  ['p(95)<1000'],
  },
};

export default function () {
  const roll = Math.random();
  if (roll < 0.40) {
    getHomePage();
    thinkTime(1, 3);
  } else if (roll < 0.70) {
    anonymousVisitorJourney();
  } else if (roll < 0.85) {
    getDashboard();
    thinkTime(1, 2);
    getFamilyCirclesPage();
  } else {
    authenticatedBrowseJourney();
  }
}
