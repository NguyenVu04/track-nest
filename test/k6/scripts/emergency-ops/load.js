/**
 * Load test — emergency-ops service
 *
 * Purpose : Validate performance under normal production concurrency.
 *           Target: 1 000 concurrent users modelled as 200 VUs.
 *
 * Traffic mix (reflects real-world usage patterns):
 *   55 % — userEmergencyScenario         (citizens locating safe zones + sending requests)
 *   25 % — serviceOperationsScenario     (operators triaging the request queue)
 *   20 % — safeZoneManagementScenario    (operators managing safe zones + targets)
 *
 * Load    : 0 → 200 VUs over 2 min, hold 5 min, ramp down 2 min.
 * Pass    : p(95) safe-zone lookup < 400 ms, writes < 800 ms, error < 1 %
 *
 * Run:
 *   k6 run --env-file .env scripts/emergency-ops/load.js
 */

import {
  userEmergencyScenario,
  serviceOperationsScenario,
  safeZoneManagementScenario,
} from '../../lib/scenarios/emergency-ops.js';
import { createStageOptions } from '../../lib/options.js';

export const options = createStageOptions({
  stages: [
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0   },
  ],

  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    'http_req_duration{name:GET /safe-zone-locator/safe-zones/nearest}':                        ['p(95)<400'],
    'http_req_duration{name:GET /emergency-request-receiver/user/:id/emergency-request-allowed}': ['p(95)<400'],
    'http_req_duration{name:POST /emergency-request-receiver/request}':                          ['p(95)<800'],
    'http_req_duration{name:GET /emergency-request-receiver/requests}':                          ['p(95)<500'],
    'http_req_duration{name:PATCH /emergency-request-manager/emergency-service/location}':       ['p(95)<600'],
    'http_req_duration{name:GET /emergency-request-manager/requests/count}':                     ['p(95)<400'],
    'http_req_duration{name:PATCH /emergency-request-manager/requests/:id/accept}':              ['p(95)<800'],
    'http_req_duration{name:PATCH /emergency-request-manager/requests/:id/close}':               ['p(95)<800'],
    'http_req_duration{name:POST /safe-zone-manager/safe-zone}':                                 ['p(95)<600'],
    'http_req_duration{name:GET /safe-zone-manager/safe-zones}':                                 ['p(95)<500'],
    'http_req_duration{name:GET /emergency-responder/targets}':                                  ['p(95)<600'],
    custom_error_rate:       ['rate<0.01'],
    custom_read_latency_ms:  ['p(95)<500'],
    custom_write_latency_ms: ['p(95)<800'],
  },
});

export default function () {
  const roll = Math.random();
  if (roll < 0.55) {
    userEmergencyScenario();
  } else if (roll < 0.80) {
    serviceOperationsScenario();
  } else {
    safeZoneManagementScenario();
  }
}
