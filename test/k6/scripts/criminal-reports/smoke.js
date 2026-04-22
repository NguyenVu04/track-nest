/**
 * Smoke test — criminal-reports service
 *
 * Purpose : Verify that key endpoints respond correctly under minimal load.
 *           Run after every deployment to catch obvious regressions fast.
 * Load    : 1 VU × 1 minute
 * Pass    : All checks green, p95 < 500 ms, error rate = 0 %
 *
 * Run:
 *   k6 run --env-file .env scripts/criminal-reports/smoke.js
 */

import { publicBrowseJourney, authenticatedReporterJourney } from '../../lib/scenarios/criminal-reports.js';
import { errorRate } from '../../lib/helpers.js';
import { createSmokeOptions } from '../../lib/options.js';

export const options = createSmokeOptions({
  vus:      1,
  duration: '1m',

  thresholds: {
    http_req_failed:             ['rate<0.01'],
    http_req_duration:           ['p(95)<500'],
    'http_req_duration{name:GET /report-viewer/crime-reports}':         ['p(95)<300'],
    'http_req_duration{name:GET /crime-locator/heatmap}':               ['p(95)<500'],
    'http_req_duration{name:POST /report-manager/crime-reports}':       ['p(95)<800'],
    'http_req_duration{name:POST /report-manager/missing-person-reports}': ['p(95)<800'],
    custom_error_rate:           ['rate<0.01'],
  },
});

export default function () {
  // Alternate between anonymous and authenticated flows
  if (__ITER % 2 === 0) {
    publicBrowseJourney();
  } else {
    authenticatedReporterJourney();
  }
}
