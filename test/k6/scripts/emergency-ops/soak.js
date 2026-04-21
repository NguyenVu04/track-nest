/**
 * Soak test — emergency-ops service
 *
 * Purpose : Detect memory leaks, DB connection leaks, and latency drift in
 *           the emergency-ops service under sustained moderate load.
 *           Critical because emergency responses must stay fast over time.
 * Load    : 8 VUs for 30 minutes.
 * Pass    : p(95) < 1 s throughout, error rate < 2 %
 *
 * Run:
 *   k6 run --env-file .env scripts/emergency-ops/soak.js
 */

import {
  safeZoneBrowseJourney,
  emergencyRequestJourney,
  getNearestSafeZones,
} from '../../lib/scenarios/emergency-ops.js';
import { thinkTime } from '../../lib/helpers.js';

export const options = {
  stages: [
    { duration: '1m',  target: 8  },
    { duration: '28m', target: 8  },
    { duration: '1m',  target: 0  },
  ],

  thresholds: {
    http_req_failed:         ['rate<0.02'],
    http_req_duration:       ['p(95)<1000'],
    custom_error_rate:       ['rate<0.02'],
    custom_read_latency_ms:  ['p(95)<800'],
    custom_write_latency_ms: ['p(95)<1500'],
  },
};

export default function () {
  const roll = Math.random();
  if (roll < 0.60) {
    getNearestSafeZones();
    thinkTime(2, 4);
  } else if (roll < 0.85) {
    safeZoneBrowseJourney();
  } else {
    emergencyRequestJourney();
  }
  thinkTime(3, 6);
}
