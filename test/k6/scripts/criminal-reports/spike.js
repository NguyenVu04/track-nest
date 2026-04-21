/**
 * Soak test — criminal-reports service
 *
 * Purpose : Run sustained moderate load for an extended period to surface
 *           memory leaks, connection-pool exhaustion, and slow DB degradation.
 * Load    : 10 VUs for 30 minutes (ramp 1 min up/down).
 * Pass    : p(95) stays below 1 s throughout, error rate < 2 %
 *
 * Run:
 *   k6 run --env-file .env scripts/criminal-reports/soak.js
 */

import {
  publicBrowseJourney,
  authenticatedReporterJourney,
  getCrimeHeatmap,
  listCrimeReportsNearby,
} from '../../lib/scenarios/criminal-reports.js';
import { thinkTime } from '../../lib/helpers.js';

export const options = {
  stages: [
    { duration: '1m',  target: 10 },
    { duration: '28m', target: 10 },
    { duration: '1m',  target: 0  },
  ],

  thresholds: {
    http_req_failed:         ['rate<0.02'],
    http_req_duration:       ['p(95)<1000'],
    custom_error_rate:       ['rate<0.02'],
    custom_read_latency_ms:  ['p(95)<800'],
    custom_write_latency_ms: ['p(95)<1500'],
  },
};

export default function () {
  const roll = Math.random();
  if (roll < 0.50) {
    publicBrowseJourney();
  } else if (roll < 0.75) {
    getCrimeHeatmap();
    thinkTime(1, 3);
    listCrimeReportsNearby();
  } else {
    authenticatedReporterJourney();
  }
  thinkTime(2, 5);
}
