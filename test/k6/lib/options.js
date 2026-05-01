// Shared k6 option configs for all performance tests.
// All duration thresholds are in milliseconds.

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

export const smokeOptions = {
  vus: 1,
  duration: '30s',
  thresholds: {
    ...commonThresholds,
    grpc_req_duration:                    ['p(95)<500'],
    checks:                               ['rate>0.99'],
    rpc_send_message_duration:            ['p(95)<500'],
    rpc_list_messages_duration:           ['p(95)<500'],
    rpc_list_tracking_notifications_duration: ['p(95)<400'],
    rpc_list_risk_notifications_duration: ['p(95)<400'],
    rpc_update_location_duration:         ['p(95)<600'],
    rpc_list_location_history_duration:   ['p(95)<600'],
    rpc_list_family_circles_duration:     ['p(95)<400'],
  },
};

export const loadOptions = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '8m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    ...commonThresholds,
    grpc_req_duration:                    ['p(95)<600'],
    checks:                               ['rate>0.95'],
    rpc_send_message_duration:            ['p(95)<600'],
    rpc_list_messages_duration:           ['p(95)<600'],
    rpc_list_tracking_notifications_duration: ['p(95)<500'],
    rpc_list_risk_notifications_duration: ['p(95)<500'],
    rpc_update_location_duration:         ['p(95)<800'],
    rpc_list_location_history_duration:   ['p(95)<800'],
    rpc_list_family_circles_duration:     ['p(95)<500'],
  },
};

export const stressOptions = {
  stages: [
    { duration: '3m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '3m', target: 150 },
    { duration: '5m', target: 150 },
    { duration: '2m', target: 0   },
  ],
  thresholds: {
    ...commonThresholds,
    grpc_req_duration:                    ['p(95)<1200'],
    checks:                               ['rate>0.90'],
    rpc_send_message_duration:            ['p(95)<1200'],
    rpc_list_messages_duration:           ['p(95)<1200'],
    rpc_list_tracking_notifications_duration: ['p(95)<1000'],
    rpc_list_risk_notifications_duration: ['p(95)<1000'],
    rpc_update_location_duration:         ['p(95)<1500'],
    rpc_list_location_history_duration:   ['p(95)<1500'],
    rpc_list_family_circles_duration:     ['p(95)<1000'],
    // Relax success rate threshold under stress
    rpc_send_message_success:             ['rate>0.85'],
    rpc_update_location_success:          ['rate>0.85'],
  },
};

export const spikeOptions = {
  stages: [
    { duration: '30s', target: 150 },
    { duration: '1m',  target: 150 },
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    ...commonThresholds,
    grpc_req_duration: ['p(95)<2000'],
    checks:            ['rate>0.80'],
    // Under spike, only enforce that the service doesn't fully collapse
    rpc_send_message_success:                 ['rate>0.70'],
    rpc_list_messages_success:                ['rate>0.70'],
    rpc_list_tracking_notifications_success:  ['rate>0.70'],
    rpc_list_risk_notifications_success:      ['rate>0.70'],
    rpc_update_location_success:              ['rate>0.70'],
    rpc_list_location_history_success:        ['rate>0.70'],
    rpc_list_family_circles_success:          ['rate>0.70'],
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

export const eoSmokeOptions = {
  vus: 1,
  duration: '30s',
  thresholds: {
    ...eoCommonThresholds,
    checks:                    ['rate>0.99'],
    eo_safe_zones_duration:       ['p(95)<300'],
    eo_request_count_duration:    ['p(95)<200'],
    eo_requests_duration:         ['p(95)<400'],
    eo_tracker_requests_duration: ['p(95)<400'],
  },
};

export const eoLoadOptions = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0   },
  ],
  thresholds: {
    ...eoCommonThresholds,
    checks:                    ['rate>0.95'],
    eo_safe_zones_duration:       ['p(95)<500'],
    eo_request_count_duration:    ['p(95)<300'],
    eo_requests_duration:         ['p(95)<600'],
    eo_tracker_requests_duration: ['p(95)<600'],
  },
};

export const eoStressOptions = {
  stages: [
    { duration: '3m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '3m', target: 150 },
    { duration: '5m', target: 150 },
    { duration: '2m', target: 0   },
  ],
  thresholds: {
    ...eoCommonThresholds,
    checks:                    ['rate>0.90'],
    eo_safe_zones_duration:       ['p(95)<1200'],
    eo_request_count_duration:    ['p(95)<800'],
    eo_requests_duration:         ['p(95)<1500'],
    eo_tracker_requests_duration: ['p(95)<1500'],
    eo_safe_zones_success:        ['rate>0.85'],
    eo_requests_success:          ['rate>0.85'],
  },
};

export const eoSpikeOptions = {
  stages: [
    { duration: '30s', target: 150 },
    { duration: '1m',  target: 150 },
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    ...eoCommonThresholds,
    checks:                    ['rate>0.80'],
    eo_safe_zones_success:        ['rate>0.70'],
    eo_request_count_success:     ['rate>0.70'],
    eo_requests_success:          ['rate>0.70'],
    eo_tracker_requests_success:  ['rate>0.70'],
  },
};
