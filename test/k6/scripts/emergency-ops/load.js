// Load test — ramp 1→100 VUs over 2 min, hold 5 min, ramp down 2 min.
// Models expected steady-state traffic for the emergency-ops service.
// Run from test/k6/:  k6 run scripts/emergency-ops/load.js

export { eoLoadOptions as options } from '../../lib/options.js';
import {
  setup as eoSetup,
  runIteration,
  makeHandleSummary,
} from '../../lib/scenarios/emergency-ops.js';

export function setup() {
  return eoSetup();
}

export default function loadIteration(data) {
  runIteration(data);
}

export function handleSummary(data) {
  return makeHandleSummary('load')(data);
}
