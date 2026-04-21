/**
 * Stress test — user-tracking gRPC service
 *
 * Purpose : Find the throughput ceiling for location update ingestion.
 *           User-tracking is on the critical path for both the mobile app
 *           and the intel-core anomaly detector (via Kafka), so latency
 *           must be measured at high concurrency.
 * Load    : 0 → 60 → 120 → 240 VUs in steps, then recovery.
 *
 * Run (from test/k6/):
 *   k6 run --env-file .env scripts/user-tracking/stress.js
 */

import {
  openConnection,
  closeConnection,
  updateUserLocation,
  listFamilyCircles,
  listLocationHistory,
  countTrackingNotifications,
  familyCircleJourney,
} from '../../lib/scenarios/user-tracking.js';
import { thinkTime } from '../../lib/helpers.js';

export const options = {
  stages: [
    { duration: '2m', target: 60  },
    { duration: '3m', target: 60  },
    { duration: '2m', target: 120 },
    { duration: '3m', target: 120 },
    { duration: '2m', target: 240 },
    { duration: '3m', target: 240 },
    { duration: '3m', target: 0   },
  ],

  thresholds: {
    grpc_req_duration: ['p(99)<5000'],
    'grpc_req_duration{name:grpc.UpdateUserLocation}': ['p(95)<1000'],
    custom_error_rate: ['rate<0.20'],
  },
};

export default function () {
  openConnection();

  const roll = Math.random();
  if (roll < 0.65) {
    // Dominant path: pure location write throughput
    updateUserLocation();
    thinkTime(0.2, 0.5);
  } else if (roll < 0.85) {
    listFamilyCircles();
    thinkTime(0.3, 0.8);
  } else if (roll < 0.95) {
    countTrackingNotifications();
    thinkTime(0.3, 0.7);
  } else {
    familyCircleJourney();
  }
}
