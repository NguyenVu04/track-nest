// Spike test — instant burst to 150 VUs for 1 minute.
// Measures service recovery behaviour after a sudden traffic surge.
// Run from test/k6/:  k6 run scripts/emergency-ops/spike.js

export { eoSpikeOptions as options } from '../../lib/options.js';
import {
  setup as eoSetup,
  runIteration,
  makeHandleSummary,
} from '../../lib/scenarios/emergency-ops.js';

export function setup() {
  return eoSetup();
}

export default function spikeIteration(data) {
  runIteration(data);
}

export function handleSummary(data) {
  return makeHandleSummary('spike')(data);
}
