/**
 * Stress test — emergency-ops service
 *
 * Purpose : Find the capacity ceiling across all three scenario paths and verify
 *           the service degrades gracefully under 1 000-user load.
 *           Safe-zone lookup and emergency-request ingestion are on the critical
 *           path of real incidents — both must stay responsive at peak.
 *
 * Step ramp identifies at which VU tier latency or errors start degrading:
 *   Step 1 — 200 VUs  (~1 000 users, normal)
 *   Step 2 — 400 VUs  (~2 000 users, moderate stress)
 *   Step 3 — 700 VUs  (~3 500 users, high stress)
 *   Step 4 — 1 000 VUs (~5 000 users, ceiling probe)
 *   Recovery — ramp to 0
 *
 * Traffic mix shifts write-heavy to stress PostGIS + Kafka + Redis simultaneously:
 *   50 % — userEmergencyScenario         (safe-zone geo queries + request writes)
 *   30 % — serviceOperationsScenario     (request state transitions — DB writes)
 *   20 % — safeZoneManagementScenario    (safe-zone CRUD — PostGIS writes)
 *
 * Pass    : p(99) < 5 s, safe-zone lookup p(95) < 2 s, error < 10 %
 *
 * Run:
 *   k6 run --env-file .env scripts/emergency-ops/stress.js
 */

import {
  userEmergencyScenario,
  serviceOperationsScenario,
  safeZoneManagementScenario,
} from '../../lib/scenarios/emergency-ops.js';

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
    http_req_failed:   ['rate<0.10'],
    http_req_duration: ['p(99)<5000'],
    'http_req_duration{name:GET /safe-zone-locator/safe-zones/nearest}':   ['p(95)<2000'],
    'http_req_duration{name:POST /emergency-request-receiver/request}':     ['p(95)<3000'],
    'http_req_duration{name:PATCH /emergency-request-manager/requests/:id/accept}': ['p(95)<3000'],
    'http_req_duration{name:POST /safe-zone-manager/safe-zone}':            ['p(95)<2000'],
    custom_error_rate:       ['rate<0.10'],
    custom_write_latency_ms: ['p(99)<4000'],
    custom_read_latency_ms:  ['p(99)<3000'],
  },
};

export default function () {
  const roll = Math.random();
  if (roll < 0.50) {
    userEmergencyScenario();
  } else if (roll < 0.80) {
    serviceOperationsScenario();
  } else {
    safeZoneManagementScenario();
  }
}
