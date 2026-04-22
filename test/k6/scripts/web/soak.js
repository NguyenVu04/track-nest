/**
 * Soak test — Next.js web frontend
 *
 * Purpose : Check for Next.js memory growth, Nginx worker process leaks,
 *           and Keycloak session-store exhaustion under sustained traffic.
 * Load    : 12 VUs for 30 minutes.
 * Pass    : p(95) < 1.5 s throughout, error rate < 2 %
 *
 * Run:
 *   k6 run --env-file .env scripts/web/soak.js
 */

import {
  anonymousVisitorJourney,
  authenticatedBrowseJourney,
  getHomePage,
} from '../../lib/scenarios/web.js';
import { thinkTime } from '../../lib/helpers.js';

export const options = {
  stages: [
    { duration: '1m',  target: 12 },
    { duration: '28m', target: 12 },
    { duration: '1m',  target: 0  },
  ],

  thresholds: {
    http_req_failed:        ['rate<0.02'],
    http_req_duration:      ['p(95)<1500'],
    custom_error_rate:      ['rate<0.02'],
    custom_read_latency_ms: ['p(95)<1200'],
  },
};

export default function () {
  const roll = Math.random();
  if (roll < 0.55) {
    anonymousVisitorJourney();
  } else if (roll < 0.80) {
    getHomePage();
    thinkTime(2, 4);
  } else {
    authenticatedBrowseJourney();
  }
  thinkTime(3, 6);
}
