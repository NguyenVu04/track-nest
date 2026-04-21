/**
 * Stress test — user-tracking gRPC service
 *
 * Purpose : Find the throughput ceiling for all three scenario paths under sustained
 *           high concurrency, validating the 1 000-user target.
 *           User-tracking is on the critical path for both the mobile app and
 *           intel-core anomaly detection (via Kafka), so latency must remain
 *           acceptable even when write throughput is saturated.
 *
 * Step ramp lets us identify at which VU tier latency or errors degrade:
 *   Step 1 — 200 VUs  (~1 000 users, expected normal)
 *   Step 2 — 400 VUs  (~2 000 users, moderate stress)
 *   Step 3 — 700 VUs  (~3 500 users, high stress)
 *   Step 4 — 1 000 VUs (~5 000 users, ceiling probe)
 *   Recovery — ramp back to 0
 *
 * Traffic mix shifts write-heavy to stress gRPC + Kafka + TimescaleDB together:
 *   60 % — locationTrackingScenario   (location writes → Kafka → TimescaleDB)
 *   25 % — circleAdminScenario        (circle write ops → PostgreSQL)
 *   15 % — messagingAndNotificationsScenario (messaging → Redis + PostgreSQL)
 *
 * Pass    : p(99) < 5 s, UpdateUserLocation p(95) < 1 s, error < 10 %
 *
 * Run (from test/k6/):
 *   k6 run --env-file .env scripts/user-tracking/stress.js
 */

import {
  openConnection,
  locationTrackingScenario,
  circleAdminScenario,
  messagingAndNotificationsScenario,
} from '../../lib/scenarios/user-tracking.js';

export const options = {
  stages: [
    { duration: '2m', target: 200  },
    { duration: '3m', target: 200  },
    { duration: '2m', target: 400  },
    { duration: '3m', target: 400  },
    { duration: '2m', target: 700  },
    { duration: '3m', target: 700  },
    { duration: '2m', target: 1000 },
    { duration: '3m', target: 1000 },
    { duration: '3m', target: 0    },
  ],

  thresholds: {
    grpc_req_duration:                                        ['p(99)<5000'],
    'grpc_req_duration{name:grpc.UpdateUserLocation}':        ['p(95)<1000'],
    'grpc_req_duration{name:grpc.CreateFamilyCircle}':        ['p(95)<2000'],
    'grpc_req_duration{name:grpc.SendMessage}':               ['p(95)<1500'],
    'grpc_req_duration{name:grpc.ListFamilyCircles}':         ['p(95)<1500'],
    custom_error_rate:                                        ['rate<0.10'],
    custom_write_latency_ms:                                  ['p(99)<3000'],
    custom_read_latency_ms:                                   ['p(99)<4000'],
  },
};

export default function () {
  openConnection();

  const roll = Math.random();
  if (roll < 0.60) {
    locationTrackingScenario();
  } else if (roll < 0.85) {
    circleAdminScenario();
  } else {
    messagingAndNotificationsScenario();
  }
}
