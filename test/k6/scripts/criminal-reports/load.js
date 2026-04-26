/**
 * Load test — criminal-reports service
 *
 * Purpose : Simulate expected peak concurrent users under normal operating
 *           conditions. Validates performance at steady-state load.
 * Load    : Ramp 0 → 50 VUs over 1 min, hold 3 min, ramp down 1 min.
 *           70 % read-only (anonymous), 30 % authenticated writes.
 * Pass    : p(95) < 500 ms reads, p(95) < 1000 ms writes, error < 1 %
 *
 * Run:
 *   k6 run --env-file .env scripts/criminal-reports/load.js
 */

import {
  publicBrowseJourney,
  authenticatedReporterJourney,
  viewPublicCrimeReports,
  getCrimeHeatmap,
  checkHighRisk,
  listCrimeReportsNearby,
} from '../../lib/scenarios/criminal-reports.js';
import { thinkTime } from '../../lib/helpers.js';
import { createStageOptions } from '../../lib/options.js';

export const options = createStageOptions({
  stages: [
    { duration: '1m',  target: 50 },
    { duration: '3m',  target: 50 },
    { duration: '1m',  target: 0  },
  ],

  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    'http_req_duration{name:GET /report-viewer/crime-reports}':            ['p(95)<400'],
    'http_req_duration{name:GET /report-viewer/missing-person-reports}':   ['p(95)<400'],
    'http_req_duration{name:GET /crime-locator/heatmap}':                  ['p(95)<600'],
    'http_req_duration{name:GET /crime-locator/high-risk-check}':          ['p(95)<300'],
    'http_req_duration{name:POST /report-manager/crime-reports}':          ['p(95)<1000'],
    'http_req_duration{name:POST /report-manager/missing-person-reports}': ['p(95)<1000'],
    custom_error_rate:           ['rate<0.01'],
    custom_read_latency_ms:      ['p(95)<600'],
    custom_write_latency_ms:     ['p(95)<1000'],
  },
});

export default function () {
  const roll = Math.random();
  if (roll < 0.40) {
    viewPublicCrimeReports();
    thinkTime(1, 2);
    getCrimeHeatmap();
  } else if (roll < 0.65) {
    checkHighRisk();
    thinkTime(0.5, 1);
    listCrimeReportsNearby();
  } else if (roll < 0.85) {
    publicBrowseJourney();
  } else {
    authenticatedReporterJourney();
  }
}
