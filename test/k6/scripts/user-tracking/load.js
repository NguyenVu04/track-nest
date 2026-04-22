/**
 * Load test — user-tracking gRPC service
 *
 * Purpose : Simulate normal production load from mobile clients continuously
 *           pushing location updates, managing circles, and reading notifications.
 *           Target: 1 000 concurrent users modelled as 200 VUs (each VU represents
 *           ~5 real users on a shared connection; mobile clients batch at 5 s intervals).
 *
 * Traffic mix (mirrors real-world mobile usage):
 *   55 % — locationTrackingScenario   (GPS push + read — the dominant path)
 *   25 % — circleAdminScenario        (setup & admin ops — less frequent)
 *   20 % — messagingAndNotificationsScenario (chat + inbox management)
 *
 * Load    : 0 → 200 VUs over 2 min, hold 5 min, ramp down 2 min.
 * Pass    : p(95) UpdateUserLocation < 2000 ms, reads < 2000 ms, error < 2 %
 *
 * Run (from test/k6/):
 *   k6 run --env-file .env scripts/user-tracking/load.js
 */

import {
  openConnection,
  closeConnection,
  locationTrackingScenario,
  circleAdminScenario,
  messagingAndNotificationsScenario,
} from '../../lib/scenarios/user-tracking.js';

export const options = {
  stages: [
    { duration: '1m', target: 200 },
    { duration: '3m', target: 500 },
    { duration: '1m', target: 0   },
  ],

  thresholds: {
    grpc_req_duration:                                                   [`p(95)<1000`],
    'grpc_req_duration{name:grpc.UpdateUserLocation}':                   [`p(95)<1000`],
    'grpc_req_duration{name:grpc.ListFamilyCircles}':                    [`p(95)<1000`],
    'grpc_req_duration{name:grpc.ListFamilyCircleMembers}':              [`p(95)<1000`],
    'grpc_req_duration{name:grpc.ListFamilyMemberLocationHistory}':      [`p(95)<1000`],
    'grpc_req_duration{name:grpc.CreateFamilyCircle}':                   [`p(95)<1000`],
    'grpc_req_duration{name:grpc.SendMessage}':                          [`p(95)<1000`],
    'grpc_req_duration{name:grpc.ListMessages}':                         [`p(95)<1000`],
    'grpc_req_duration{name:grpc.CountTrackingNotifications}':           [`p(95)<1000`],
    'grpc_req_duration{name:grpc.CountRiskNotifications}':               [`p(95)<1000`],
    custom_error_rate:                                                   ['rate<0.01'],
    custom_read_latency_ms:                                              [`p(95)<1000`],
    custom_write_latency_ms:                                             [`p(95)<1000`],
  },
};

export default function () {
  openConnection();

  const roll = Math.random();
  if (roll < 0.9) {
    locationTrackingScenario();
  } else if (roll < 0.95) {
    circleAdminScenario();
  } else {
    messagingAndNotificationsScenario();
  }

  closeConnection();
}
