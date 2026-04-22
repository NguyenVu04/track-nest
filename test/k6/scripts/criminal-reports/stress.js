/**
 * Stress test — criminal-reports service
 *
 * Purpose : Incrementally ramp load beyond normal capacity to find the
 *           breaking point. Measure where errors start, where p(99) spikes,
 *           and whether the service recovers when load is reduced.
 * Load    : 0 → 50 → 100 → 200 → 300 VUs in steps; then recovery.
 * Thresholds: intentionally loose — this test collects data, not gates.
 *
 * Run:
 *   k6 run --env-file .env scripts/criminal-reports/stress.js
 */

import {
  viewPublicCrimeReports,
  viewPublicMissingPersonReports,
  getCrimeHeatmap,
  checkHighRisk,
  listCrimeReportsNearby,
  createCrimeReport,
} from '../../lib/scenarios/criminal-reports.js';
import { thinkTime } from '../../lib/helpers.js';

export const options = {
  stages: [
    { duration: '2m',  target: 50  },  // warm-up
    { duration: '3m',  target: 50  },  // normal
    { duration: '2m',  target: 100 },  // ramp to 2× normal
    { duration: '3m',  target: 100 },
    { duration: '2m',  target: 200 },  // ramp to 4× normal
    { duration: '3m',  target: 200 },
    { duration: '2m',  target: 300 },  // peak stress
    { duration: '3m',  target: 300 },
    { duration: '3m',  target: 0   },  // recovery
  ],

  thresholds: {
    // Warn but don't abort — we want full data collection.
    http_req_failed:   ['rate<0.30'],
    http_req_duration: ['p(99)<5000'],
  },
};

export default function () {
  const roll = Math.random();
  if (roll < 0.55) {
    viewPublicCrimeReports();
    thinkTime(0.5, 1.5);
    getCrimeHeatmap();
  } else if (roll < 0.80) {
    checkHighRisk();
    thinkTime(0.5, 1);
    listCrimeReportsNearby();
  } else if (roll < 0.95) {
    viewPublicMissingPersonReports();
  } else {
    // Small write fraction to stress DB writes under peak
    createCrimeReport();
  }
  thinkTime(0.3, 1);
}
