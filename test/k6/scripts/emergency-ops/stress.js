// Stress test — ramp to 150 VUs across two stages.
// Finds the breaking point and measures degradation under heavy load.
// Run from test/k6/:  k6 run scripts/emergency-ops/stress.js

export { eoStressOptions as options } from '../../lib/options.js';
import {
  setup as eoSetup,
  runIteration,
  makeHandleSummary,
} from '../../lib/scenarios/emergency-ops.js';

export function setup() {
  return eoSetup();
}

export default function stressIteration(data) {
  runIteration(data);
}

export function handleSummary(data) {
  return makeHandleSummary('stress')(data);
}
