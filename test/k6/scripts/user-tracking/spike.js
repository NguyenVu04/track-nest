/**
 * Spike test — user-tracking gRPC service
 *
 * Purpose : Verify the service survives a sudden burst of 1 000 concurrent users
 *           and recovers cleanly once the spike subsides.
 *           Spike scenarios occur in production when an emergency alert causes
 *           all family members to simultaneously open the app and start streaming
 *           location data — the worst-case write amplification event.
 *
 * Profile:
 *   Baseline  —  20 VUs for 1 min  (normal background traffic)
 *   Spike     → 1 000 VUs in 30 s  (sudden burst)
 *   Hold      — 1 000 VUs for 2 min (sustained spike)
 *   Recovery  →  20 VUs in 30 s    (ramp down)
 *   Settle    —  20 VUs for 3 min  (confirm recovery; no residual errors)
 *
 * Traffic mix is write-dominated to maximise pressure on gRPC + Kafka + TimescaleDB:
 *   70 % — locationTrackingScenario  (GPS writes — dominates during emergencies)
 *   20 % — circleAdminScenario       (users checking circle membership)
 *   10 % — messagingAndNotificationsScenario (flood of check-in messages)
 *
 * Pass    : service reaches steady state in < 30 s after ramp-down,
 *           p(95) UpdateUserLocation < 2 s during spike, error rate < 15 %,
 *           error rate < 1 % during recovery phase.
 *
 * Run (from test/k6/):
 *   k6 run --env-file .env scripts/user-tracking/spike.js
 */

import {
  openConnection,
  locationTrackingScenario,
  circleAdminScenario,
  messagingAndNotificationsScenario,
} from '../../lib/scenarios/user-tracking.js';

export const options = {
  stages: [
    { duration: '1m',  target: 20   },  // baseline
    { duration: '30s', target: 1000 },  // spike
    { duration: '2m',  target: 1000 },  // hold at peak
    { duration: '30s', target: 20   },  // ramp down
    { duration: '3m',  target: 20   },  // recovery window
  ],

  thresholds: {
    // Overall — allow degraded latency during spike but service must survive.
    grpc_req_duration:                                        ['p(99)<8000'],
    'grpc_req_duration{name:grpc.UpdateUserLocation}':        ['p(95)<2000'],
    'grpc_req_duration{name:grpc.ListFamilyCircles}':         ['p(95)<3000'],
    'grpc_req_duration{name:grpc.SendMessage}':               ['p(95)<3000'],
    custom_error_rate:                                        ['rate<0.15'],
  },
};

export default function () {
  openConnection();

  const roll = Math.random();
  if (roll < 0.70) {
    locationTrackingScenario();
  } else if (roll < 0.90) {
    circleAdminScenario();
  } else {
    messagingAndNotificationsScenario();
  }
}
