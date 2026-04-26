/**
 * Smoke test — emergency-ops service
 *
 * Purpose : Verify all three scenario paths (user, service operations, safe-zone
 *           management) respond correctly after each deployment.
 * Load    : 1 VU × 2 minutes
 * Pass    : All checks green, p(95) < 500 ms, error rate = 0 %
 *
 * Run:
 *   k6 run --env-file .env scripts/emergency-ops/smoke.js
 */

import {
  userEmergencyScenario,
  serviceOperationsScenario,
  safeZoneManagementScenario,
} from '../../lib/scenarios/emergency-ops.js';
import { createSmokeOptions } from '../../lib/options.js';

export const options = createSmokeOptions({
  vus:      1,
  duration: '2m',

  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    'http_req_duration{name:GET /safe-zone-locator/safe-zones/nearest}':                        ['p(95)<400'],
    'http_req_duration{name:POST /emergency-request-receiver/request}':                          ['p(95)<600'],
    'http_req_duration{name:PATCH /emergency-request-manager/emergency-service/location}':       ['p(95)<500'],
    'http_req_duration{name:POST /safe-zone-manager/safe-zone}':                                 ['p(95)<500'],
    custom_error_rate:       ['rate<0.01'],
    custom_read_latency_ms:  ['p(95)<400'],
    custom_write_latency_ms: ['p(95)<500'],
  },
});

export default function () {
  // Round-robin through all three scenarios so every endpoint is exercised.
  const scenario = __ITER % 3;
  if (scenario === 0) {
    userEmergencyScenario();
  } else if (scenario === 1) {
    serviceOperationsScenario();
  } else {
    safeZoneManagementScenario();
  }
}
