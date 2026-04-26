/**
 * Stress test — Next.js web frontend
 *
 * Purpose : Determine the maximum concurrent-user capacity of the Next.js
 *           SSR server behind Nginx. Home page is a good proxy for overall
 *           rendering throughput; dashboard pages exercise Keycloak.
 * Load    : 0 → 100 → 200 → 400 VUs in steps, then recovery.
 *
 * Run:
 *   k6 run --env-file .env scripts/web/stress.js
 */

import {
  getHomePage,
  getDashboard,
  getFamilyCirclesPage,
  anonymousVisitorJourney,
} from '../../lib/scenarios/web.js';
import { thinkTime } from '../../lib/helpers.js';
import { createStageOptions } from '../../lib/options.js';

export const options = createStageOptions({
  stages: [
    { duration: '2m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '3m', target: 200 },
    { duration: '2m', target: 400 },
    { duration: '3m', target: 400 },
    { duration: '3m', target: 0   },
  ],

  thresholds: {
    http_req_failed:   ['rate<0.25'],
    http_req_duration: ['p(99)<8000'],
    'http_req_duration{name:GET /}': ['p(95)<3000'],
  },
});

export default function () {
  const roll = Math.random();
  if (roll < 0.60) {
    getHomePage();
    thinkTime(0.3, 1);
  } else if (roll < 0.80) {
    getDashboard();
    thinkTime(0.5, 1);
  } else if (roll < 0.92) {
    anonymousVisitorJourney();
  } else {
    getFamilyCirclesPage();
    thinkTime(0.3, 0.8);
  }
}
