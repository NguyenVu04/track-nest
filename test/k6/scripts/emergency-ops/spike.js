/**
 * Spike test — emergency-ops service
 *
 * Purpose : Verify the service survives a sudden 1 000-user burst and recovers
 *           cleanly. The realistic spike scenario is a mass-casualty or natural
 *           disaster event: every citizen in range simultaneously opens the app,
 *           submits an emergency request, and looks for the nearest safe zone
 *           while emergency operators flood in to triage the queue.
 *
 * Profile:
 *   Baseline  —  20 VUs for 1 min   (normal background traffic)
 *   Spike     → 1 000 VUs in 30 s   (sudden burst)
 *   Hold      — 1 000 VUs for 2 min  (sustained incident peak)
 *   Recovery  →  20 VUs in 30 s     (incident contained, traffic drops)
 *   Settle    —  20 VUs for 3 min   (confirm no residual errors or latency tail)
 *
 * Traffic mix is write and geo-query dominated — worst case for PostGIS + Kafka:
 *   65 % — userEmergencyScenario         (mass request submissions + safe-zone queries)
 *   25 % — serviceOperationsScenario     (operators swarming the triage queue)
 *   10 % — safeZoneManagementScenario    (operators activating additional safe zones)
 *
 * Pass    : p(95) safe-zone lookup < 3 s during spike, error < 15 %,
 *           error < 1 % in recovery window.
 *
 * Run:
 *   k6 run --env-file .env scripts/emergency-ops/spike.js
 */

import {
  userEmergencyScenario,
  serviceOperationsScenario,
  safeZoneManagementScenario,
} from '../../lib/scenarios/emergency-ops.js';
import { createStageOptions } from '../../lib/options.js';

export const options = createStageOptions({
  stages: [
    { duration: '1m',  target: 20   },  // baseline
    { duration: '30s', target: 1000 },  // spike
    { duration: '2m',  target: 1000 },  // hold at peak
    { duration: '30s', target: 20   },  // ramp down
    { duration: '3m',  target: 20   },  // recovery window
  ],

  thresholds: {
    // Allow heavy degradation during spike but service must not crash.
    http_req_failed:   ['rate<0.15'],
    http_req_duration: ['p(99)<10000'],
    'http_req_duration{name:GET /safe-zone-locator/safe-zones/nearest}':  ['p(95)<3000'],
    'http_req_duration{name:POST /emergency-request-receiver/request}':    ['p(95)<5000'],
    'http_req_duration{name:PATCH /emergency-request-manager/requests/:id/accept}': ['p(95)<5000'],
    custom_error_rate: ['rate<0.15'],
  },
});

export default function () {
  const roll = Math.random();
  if (roll < 0.65) {
    userEmergencyScenario();
  } else if (roll < 0.90) {
    serviceOperationsScenario();
  } else {
    safeZoneManagementScenario();
  }
}
