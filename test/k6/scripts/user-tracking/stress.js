// Stress test — ramp to 100 VUs across two stages.
// Finds the service's breaking point and measures degradation under heavy load.
// Run from test/k6/:  k6 run scripts/user-tracking/stress.js

export { stressOptions as options } from '../../lib/options.js';
import {
  setup as userTrackingSetup,
  runIteration,
  makeHandleSummary,
} from '../../lib/scenarios/user-tracking.js';

export function setup() {
  return userTrackingSetup();
}

export default function stressIteration(data) {
  runIteration(data);
}

export function handleSummary(data) {
  return makeHandleSummary('stress')(data);
}
