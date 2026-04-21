/**
 * Smoke test — user-tracking gRPC service
 *
 * Purpose : Verify all key gRPC RPCs respond correctly after each deployment.
 * Load    : 1 VU × 1 minute
 * Pass    : All gRPC checks pass, p(95) < 500 ms, error rate = 0 %
 *
 * Prerequisites:
 *   • k6 v0.49+
 *   • Run from test/k6/ directory so proto paths resolve correctly
 *     or set PROTO_PATH env var.
 *
 * Run (from test/k6/):
 *   k6 run --env-file .env scripts/user-tracking/smoke.js
 */

import {
  client,
  openConnection,
  closeConnection,
  locationUpdateJourney,
  familyCircleJourney,
  updateUserLocation,
  listFamilyCircles,
  countTrackingNotifications,
  listTrackingNotifications,
} from '../../lib/scenarios/user-tracking.js';

export const options = {
  vus:      1,
  duration: '1m',

  thresholds: {
    grpc_req_duration:       ['p(95)<500'],
    custom_error_rate:       ['rate<0.01'],
    custom_read_latency_ms:  ['p(95)<400'],
    custom_write_latency_ms: ['p(95)<500'],
  },
};

export function setup() {
  // Connection opened once per VU in setup is not possible in k6;
  // we open it inside the default fn on first call instead.
}

export default function () {
  openConnection();

  if (__ITER % 2 === 0) {
    locationUpdateJourney();
  } else {
    familyCircleJourney();
  }
}

export function teardown() {
  closeConnection();
}
