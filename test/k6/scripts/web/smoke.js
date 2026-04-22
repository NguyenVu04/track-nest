/**
 * Smoke test — Next.js web frontend
 *
 * Purpose : Verify the web app serves pages after each deployment.
 *           Unauthenticated users see the landing page; authenticated users
 *           navigating to /dashboard receive a redirect to Keycloak — both
 *           are valid and tested here.
 * Load    : 1 VU × 1 minute
 * Pass    : All key pages respond, p(95) < 800 ms, error rate = 0 %
 *
 * Run:
 *   k6 run --env-file .env scripts/web/smoke.js
 */

import {
  anonymousVisitorJourney,
  authenticatedBrowseJourney,
  getHomePage,
  getDashboard,
  getFamilyCirclesPage,
} from '../../lib/scenarios/web.js';

export const options = {
  vus:      1,
  duration: '1m',

  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
    'http_req_duration{name:GET /}':                           ['p(95)<600'],
    'http_req_duration{name:GET /dashboard}':                  ['p(95)<800'],
    'http_req_duration{name:GET /dashboard/family-circles}':   ['p(95)<800'],
    custom_error_rate: ['rate<0.01'],
  },
};

export default function () {
  if (__ITER % 3 === 0) {
    authenticatedBrowseJourney();
  } else {
    anonymousVisitorJourney();
  }
}
