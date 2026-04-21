/**
 * Soak test — user-tracking gRPC service
 *
 * Purpose : Detect long-running issues — gRPC channel leaks, TimescaleDB
 *           hypertable bloat, Quartz job interference, and Redis session drift.
 *           Location data must remain fast over the entire 30-minute window.
 * Load    : 10 VUs for 30 minutes.
 * Pass    : p(95) < 800 ms throughout, error rate < 2 %
 *
 * Run (from test/k6/):
 *   k6 run --env-file .env scripts/user-tracking/soak.js
 */

import {
  openConnection,
  closeConnection,
  updateUserLocation,
  listFamilyCircles,
  countTrackingNotifications,
  locationUpdateJourney,
  familyCircleJourney,
} from '../../lib/scenarios/user-tracking.js';
import { thinkTime } from '../../lib/helpers.js';

export const options = {
  stages: [
    { duration: '1m',  target: 10 },
    { duration: '28m', target: 10 },
    { duration: '1m',  target: 0  },
  ],

  thresholds: {
    grpc_req_duration:       ['p(95)<800'],
    custom_error_rate:       ['rate<0.02'],
    custom_read_latency_ms:  ['p(95)<700'],
    custom_write_latency_ms: ['p(95)<600'],
  },
};

export default function () {
  openConnection();

  const roll = Math.random();
  if (roll < 0.55) {
    updateUserLocation();
    thinkTime(1, 2);
  } else if (roll < 0.80) {
    locationUpdateJourney();
  } else {
    familyCircleJourney();
  }
  thinkTime(2, 5);
}
