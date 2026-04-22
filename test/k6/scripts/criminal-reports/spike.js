/**
 * Spike test — criminal-reports service
 *
 * Purpose : Validate sudden demand shock handling and short-term recovery.
 * Load    : 10 VUs baseline, spike to 300 VUs, then settle.
 * Pass    : service remains available and error rate stays < 10 % during spike.
 *
 * Run:
 *   k6 run --env-file .env scripts/criminal-reports/spike.js
 */

import {
  publicBrowseJourney,
  authenticatedReporterJourney,
  getCrimeHeatmap,
  listCrimeReportsNearby,
} from '../../lib/scenarios/criminal-reports.js';
import { thinkTime } from '../../lib/helpers.js';
import { createStageOptions } from '../../lib/options.js';

export const options = createStageOptions({
  stages: [
    { duration: '1m',  target: 10  },
    { duration: '30s', target: 300 },
    { duration: '2m',  target: 300 },
    { duration: '30s', target: 10  },
    { duration: '2m',  target: 10  },
    { duration: '1m',  target: 0   },
  ],

  thresholds: {
    http_req_failed:         ['rate<0.10'],
    http_req_duration:       ['p(99)<6000'],
    custom_error_rate:       ['rate<0.10'],
    custom_read_latency_ms:  ['p(99)<4000'],
    custom_write_latency_ms: ['p(99)<5000'],
  },
});

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
