// Shared k6 option configs for all performance tests.
// All duration thresholds are in milliseconds.
// Acceptance ceiling: p95 < 2 000 ms (spike, heavy RPCs).
// Lighter scenarios scale down proportionally; smoke stays tight as a sanity check.

const commonThresholds = {
  // Built-in gRPC duration (all methods combined)
  grpc_req_duration: [],
  // All check() assertions
  checks: [],
  // Per-RPC success rates
  rpc_send_message_success:                 ['rate>0.95'],
  rpc_list_messages_success:                ['rate>0.95'],
  rpc_list_tracking_notifications_success:  ['rate>0.95'],
  rpc_list_risk_notifications_success:      ['rate>0.95'],
  rpc_update_location_success:              ['rate>0.95'],
  rpc_list_location_history_success:        ['rate>0.95'],
  rpc_list_family_circles_success:          ['rate>0.95'],
};

// Smoke — 1 VU, baseline sanity check, near-zero contention.
export const smokeOptions = {
  vus: 1,
  duration: '30s',
  env: { ITER_THINK_MIN: '3', ITER_THINK_MAX: '8' },
  thresholds: {
    ...commonThresholds,
    grpc_req_duration:                            ['p(95)<1000'],
    checks:                                       ['rate>0.99'],
    rpc_send_message_duration:                    ['p(95)<800'],
    rpc_list_messages_duration:                   ['p(95)<800'],
    rpc_list_tracking_notifications_duration:     ['p(95)<600'],
    rpc_list_risk_notifications_duration:         ['p(95)<600'],
    rpc_update_location_duration:                 ['p(95)<1000'],  // DB write + Aiven Kafka
    rpc_list_location_history_duration:           ['p(95)<1000'],  // TimescaleDB time-series scan
    rpc_list_family_circles_duration:             ['p(95)<600'],
  },
};

// Load — ramp to 100 VUs, hold 8 min. Models expected steady-state traffic.
export const loadOptions = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '8m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  env: { ITER_THINK_MIN: '5', ITER_THINK_MAX: '15' },
  thresholds: {
    ...commonThresholds,
    grpc_req_duration:                            ['p(95)<1600'],
    checks:                                       ['rate>0.95'],
    rpc_send_message_duration:                    ['p(95)<1400'],
    rpc_list_messages_duration:                   ['p(95)<1400'],
    rpc_list_tracking_notifications_duration:     ['p(95)<1000'],
    rpc_list_risk_notifications_duration:         ['p(95)<1000'],
    rpc_update_location_duration:                 ['p(95)<1600'],
    rpc_list_location_history_duration:           ['p(95)<1600'],
    rpc_list_family_circles_duration:             ['p(95)<1000'],
  },
};

// Stress — ramp to 150 VUs in two steps. Finds the breaking point.
export const stressOptions = {
  stages: [
    { duration: '3m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '3m', target: 150 },
    { duration: '5m', target: 150 },
    { duration: '2m', target: 0   },
  ],
  env: { ITER_THINK_MIN: '2', ITER_THINK_MAX: '5' },
  thresholds: {
    ...commonThresholds,
    grpc_req_duration:                            ['p(95)<2000'],
    checks:                                       ['rate>0.90'],
    rpc_send_message_duration:                    ['p(95)<1800'],
    rpc_list_messages_duration:                   ['p(95)<1800'],
    rpc_list_tracking_notifications_duration:     ['p(95)<1500'],
    rpc_list_risk_notifications_duration:         ['p(95)<1500'],
    rpc_update_location_duration:                 ['p(95)<2000'],
    rpc_list_location_history_duration:           ['p(95)<2000'],
    rpc_list_family_circles_duration:             ['p(95)<1500'],
    // Relax success rates for write-heavy RPCs under sustained load
    rpc_send_message_success:                     ['rate>0.85'],
    rpc_update_location_success:                  ['rate>0.85'],
  },
};

// ── Emergency-ops HTTP options ────────────────────────────────────────────────

const eoCommonThresholds = {
  http_req_duration: [],
  checks:            [],
  eo_safe_zones_success:       ['rate>0.95'],
  eo_request_count_success:    ['rate>0.95'],
  eo_requests_success:         ['rate>0.95'],
  eo_tracker_requests_success: ['rate>0.95'],
};

// Smoke — 1 VU, near-zero contention baseline.
export const eoSmokeOptions = {
  vus: 1,
  duration: '30s',
  env: { ITER_THINK_MIN: '3', ITER_THINK_MAX: '8' },
  thresholds: {
    ...eoCommonThresholds,
    checks:                       ['rate>0.99'],
    eo_request_count_duration:    ['p(95)<600'],
    eo_safe_zones_duration:       ['p(95)<800'],  // PostGIS spatial query
    eo_requests_duration:         ['p(95)<1000'],
    eo_tracker_requests_duration: ['p(95)<1000'],
  },
};

// Load — ramp to 100 VUs, hold 5 min.
export const eoLoadOptions = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '8m', target: 100 },
    { duration: '2m', target: 0   },
  ],
  env: { ITER_THINK_MIN: '5', ITER_THINK_MAX: '15' },
  thresholds: {
    ...eoCommonThresholds,
    checks:                       ['rate>0.95'],
    eo_request_count_duration:    ['p(95)<1000'],
    eo_safe_zones_duration:       ['p(95)<1400'],
    eo_requests_duration:         ['p(95)<1600'],
    eo_tracker_requests_duration: ['p(95)<1600'],
  },
};

// Stress — ramp to 150 VUs in two steps.
export const eoStressOptions = {
  stages: [
    { duration: '3m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '3m', target: 150 },
    { duration: '5m', target: 150 },
    { duration: '2m', target: 0   },
  ],
  env: { ITER_THINK_MIN: '2', ITER_THINK_MAX: '5' },
  thresholds: {
    ...eoCommonThresholds,
    checks:                       ['rate>0.90'],
    eo_request_count_duration:    ['p(95)<1800'],
    eo_safe_zones_duration:       ['p(95)<2000'],
    eo_requests_duration:         ['p(95)<2000'],
    eo_tracker_requests_duration: ['p(95)<2000'],
    eo_safe_zones_success:        ['rate>0.85'],
    eo_requests_success:          ['rate>0.85'],
  },
};
