// Load test — ramp 1→20 VUs over 2 min, hold 5 min, ramp down 2 min.
// Models expected steady-state traffic.
// Run from test/k6/:  k6 run scripts/user-tracking/load.js

export { loadOptions as options } from '../../lib/options.js';
import {
  setup as userTrackingSetup,
  runIteration,
  makeHandleSummary,
} from '../../lib/scenarios/user-tracking.js';

export function setup() {
  return userTrackingSetup();
}

export default function loadIteration(data) {
  runIteration(data);
}

export function handleSummary(data) {
  return makeHandleSummary('load')(data);
}
