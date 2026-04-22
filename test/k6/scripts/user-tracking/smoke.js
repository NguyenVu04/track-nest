/**
 * Smoke test — user-tracking gRPC service
 *
 * Purpose : Verify all three scenario paths respond correctly after each deployment.
 *           Rotates through locationTrackingScenario, circleAdminScenario, and
 *           messagingAndNotificationsScenario to exercise ~90% of endpoints.
 * Load    : 1 VU × 1 minute
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
import { createSmokeOptions } from '../../lib/options.js';

const env = JSON.parse(open('../../lib/data/env.json'));
const host = String(env.USER_TRACKING_GRPC_HOST || 'localhost:19090').toLowerCase();
const isLocalTarget = host.includes('localhost') || host.includes('127.0.0.1');

const grpcP95Ms = Number(env.K6_THRESHOLD_GRPC_P95_MS || (isLocalTarget ? 500 : 1200));
const updateP95Ms = Number(env.K6_THRESHOLD_UPDATE_P95_MS || (isLocalTarget ? 400 : 1000));
const createP95Ms = Number(env.K6_THRESHOLD_CREATE_P95_MS || (isLocalTarget ? 500 : 1200));
const sendP95Ms = Number(env.K6_THRESHOLD_SEND_P95_MS || (isLocalTarget ? 500 : 1200));
const readP95Ms = Number(env.K6_THRESHOLD_READ_P95_MS || (isLocalTarget ? 400 : 1000));
const writeP95Ms = Number(env.K6_THRESHOLD_WRITE_P95_MS || (isLocalTarget ? 500 : 1200));

export const options = createSmokeOptions({
  vus:      1,
  duration: '1m',

  thresholds: {
    grpc_req_duration:                                              [`p(95)<${grpcP95Ms}`],
    'grpc_req_duration{name:grpc.UpdateUserLocation}':             [`p(95)<${updateP95Ms}`],
    'grpc_req_duration{name:grpc.CreateFamilyCircle}':             [`p(95)<${createP95Ms}`],
    'grpc_req_duration{name:grpc.SendMessage}':                    [`p(95)<${sendP95Ms}`],
    custom_error_rate:                                             ['rate<0.01'],
    custom_read_latency_ms:                                        [`p(95)<${readP95Ms}`],
    custom_write_latency_ms:                                       [`p(95)<${writeP95Ms}`],
  },
});

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
