/**
 * Load test — user-tracking gRPC service
 *
 * Purpose : Simulate normal concurrent load from mobile clients continuously
 *           pushing location updates and polling family circle state.
 *           Location updates are the dominant RPC — model them at ~70 % of calls.
 * Load    : 0 → 40 VUs over 1 min, hold 3 min, ramp down 1 min.
 * Pass    : p(95) < 300 ms for UpdateUserLocation, p(95) < 600 ms reads, error < 1 %
 *
 * Run (from test/k6/):
 *   k6 run --env-file .env scripts/user-tracking/load.js
 */

import {
  client,
  openConnection,
  closeConnection,
  updateUserLocation,
  listFamilyCircles,
  listFamilyCircleMembers,
  listLocationHistory,
  countTrackingNotifications,
  listTrackingNotifications,
  locationUpdateJourney,
  familyCircleJourney,
} from '../../lib/scenarios/user-tracking.js';
import { thinkTime } from '../../lib/helpers.js';

export const options = {
  stages: [
    { duration: '1m', target: 40 },
    { duration: '3m', target: 40 },
    { duration: '1m', target: 0  },
  ],

  thresholds: {
    grpc_req_duration:       ['p(95)<600', 'p(99)<1200'],
    'grpc_req_duration{name:grpc.UpdateUserLocation}':       ['p(95)<300'],
    'grpc_req_duration{name:grpc.ListFamilyCircles}':        ['p(95)<500'],
    'grpc_req_duration{name:grpc.ListFamilyCircleMembers}':  ['p(95)<500'],
    'grpc_req_duration{name:grpc.CountTrackingNotifications}': ['p(95)<300'],
    custom_error_rate:       ['rate<0.01'],
    custom_read_latency_ms:  ['p(95)<500'],
    custom_write_latency_ms: ['p(95)<300'],
  },
};

export default function () {
  openConnection();

  const roll = Math.random();
  if (roll < 0.50) {
    // Most common: rapid location ping
    updateUserLocation();
    thinkTime(0.5, 1);
  } else if (roll < 0.75) {
    locationUpdateJourney();
  } else if (roll < 0.90) {
    familyCircleJourney();
  } else {
    listTrackingNotifications();
    thinkTime(1, 2);
    countTrackingNotifications();
  }
}
