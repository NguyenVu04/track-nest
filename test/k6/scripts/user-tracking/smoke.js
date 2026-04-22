/**
 * Smoke test — user-tracking gRPC service
 *
 * Purpose : Verify all three scenario paths respond correctly after each deployment.
 *           Rotates through locationTrackingScenario, circleAdminScenario, and
 *           messagingAndNotificationsScenario to exercise ~90% of endpoints.
 * Load    : 1 VU × 2 minutes
 * Pass    : All gRPC checks pass, p(95) < 500 ms, error rate = 0 %
 *
 * Run (from test/k6/):
 *   k6 run --env-file .env scripts/user-tracking/smoke.js
 */

import {
  client,
  openConnection,
  closeConnection,
  locationTrackingScenario,
  circleAdminScenario,
  messagingAndNotificationsScenario,
} from '../../lib/scenarios/user-tracking.js';

export const options = {
  vus:      1,
  duration: '2m',

  thresholds: {
    grpc_req_duration:                                              ['p(95)<500'],
    'grpc_req_duration{name:grpc.UpdateUserLocation}':             ['p(95)<400'],
    'grpc_req_duration{name:grpc.CreateFamilyCircle}':             ['p(95)<500'],
    'grpc_req_duration{name:grpc.SendMessage}':                    ['p(95)<500'],
    custom_error_rate:                                             ['rate<0.01'],
    custom_read_latency_ms:                                        ['p(95)<400'],
    custom_write_latency_ms:                                       ['p(95)<500'],
  },
};

export default function () {
  openConnection();

  // Round-robin through all three scenarios so every endpoint gets hit.
  const scenario = __ITER % 3;
  if (scenario === 0) {
    locationTrackingScenario();
  } else if (scenario === 1) {
    circleAdminScenario();
  } else {
    messagingAndNotificationsScenario();
  }
}

export function teardown() {
  closeConnection();
}
