/**
 * Smoke test — emergency-ops service
 *
 * Purpose : Verify safe-zone lookup and emergency request endpoints are
 *           reachable and return correct responses after each deployment.
 * Load    : 1 VU × 1 minute
 * Pass    : All checks green, p(95) < 500 ms, error rate = 0 %
 *
 * Run:
 *   k6 run --env-file .env scripts/emergency-ops/smoke.js
 */

import {
  safeZoneBrowseJourney,
  emergencyRequestJourney,
} from '../../lib/scenarios/emergency-ops.js';

export const options = {
  vus:      1,
  duration: '1m',

  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    'http_req_duration{name:GET /safe-zone-locator/safe-zones/nearest}':     ['p(95)<400'],
    'http_req_duration{name:POST /emergency-request-receiver/request}':       ['p(95)<800'],
    'http_req_duration{name:GET /emergency-request-receiver/requests}':       ['p(95)<400'],
    custom_error_rate: ['rate<0.01'],
  },
};

export default function () {
  if (__ITER % 3 === 0) {
    emergencyRequestJourney();
  } else {
    safeZoneBrowseJourney();
  }
}
