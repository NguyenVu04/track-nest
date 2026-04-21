/**
 * Stress test — emergency-ops service
 *
 * Purpose : Find the capacity ceiling of the emergency-ops service and verify
 *           it degrades gracefully (no data corruption, recovery after peak).
 *           Safe-zone lookup must stay < 2 s even at 200 VUs — it is on the
 *           critical path of any real emergency response.
 * Load    : 0 → 50 → 100 → 200 VUs, then recovery.
 *
 * Run:
 *   k6 run --env-file .env scripts/emergency-ops/stress.js
 */

import {
  getNearestSafeZones,
  getMyEmergencyRequests,
  createEmergencyRequest,
  checkEmergencyAllowed,
} from '../../lib/scenarios/emergency-ops.js';
import { thinkTime } from '../../lib/helpers.js';

export const options = {
  stages: [
    { duration: '2m', target: 50  },
    { duration: '3m', target: 50  },
    { duration: '2m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '3m', target: 200 },
    { duration: '3m', target: 0   },
  ],

  thresholds: {
    http_req_failed:   ['rate<0.20'],
    // Safe-zone lookup has a tighter SLO even under stress
    'http_req_duration{name:GET /safe-zone-locator/safe-zones/nearest}': ['p(95)<2000'],
    http_req_duration: ['p(99)<5000'],
  },
};

export default function () {
  const roll = Math.random();
  if (roll < 0.60) {
    getNearestSafeZones();
    thinkTime(0.5, 1);
  } else if (roll < 0.80) {
    getMyEmergencyRequests();
    thinkTime(0.5, 1);
  } else if (roll < 0.93) {
    checkEmergencyAllowed();
    thinkTime(0.3, 0.8);
  } else {
    createEmergencyRequest();
  }
  thinkTime(0.3, 1);
}
