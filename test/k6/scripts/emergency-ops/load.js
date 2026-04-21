/**
 * Load test — emergency-ops service
 *
 * Purpose : Validate performance under normal concurrent load.
 *           Safe-zone queries are the dominant traffic pattern;
 *           emergency request submissions are infrequent but critical.
 * Load    : 0 → 40 VUs over 1 min, hold 3 min, ramp down 1 min.
 * Pass    : p(95) < 600 ms reads, p(95) < 1000 ms writes, error < 1 %
 *
 * Run:
 *   k6 run --env-file .env scripts/emergency-ops/load.js
 */

import {
  safeZoneBrowseJourney,
  emergencyRequestJourney,
  getNearestSafeZones,
  getMyEmergencyRequests,
  checkEmergencyAllowed,
} from '../../lib/scenarios/emergency-ops.js';
import { thinkTime } from '../../lib/helpers.js';

export const options = {
  stages: [
    { duration: '1m', target: 40 },
    { duration: '3m', target: 40 },
    { duration: '1m', target: 0  },
  ],

  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    'http_req_duration{name:GET /safe-zone-locator/safe-zones/nearest}':    ['p(95)<600'],
    'http_req_duration{name:POST /emergency-request-receiver/request}':      ['p(95)<1000'],
    'http_req_duration{name:GET /emergency-request-receiver/requests}':      ['p(95)<500'],
    custom_error_rate:           ['rate<0.01'],
    custom_read_latency_ms:      ['p(95)<600'],
    custom_write_latency_ms:     ['p(95)<1000'],
  },
};

export default function () {
  const roll = Math.random();
  if (roll < 0.45) {
    getNearestSafeZones();
    thinkTime(1, 2);
  } else if (roll < 0.70) {
    safeZoneBrowseJourney();
  } else if (roll < 0.85) {
    getMyEmergencyRequests();
    thinkTime(0.5, 1.5);
    checkEmergencyAllowed();
  } else {
    emergencyRequestJourney();
  }
}
