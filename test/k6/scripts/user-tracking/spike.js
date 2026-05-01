// Spike test — instant burst to 150 VUs for 1 minute.
// Measures recovery behaviour after a sudden traffic surge.
// Run from test/k6/:  k6 run scripts/user-tracking/spike.js

export { spikeOptions as options } from '../../lib/options.js';
import {
  setup as userTrackingSetup,
  runIteration,
  makeHandleSummary,
} from '../../lib/scenarios/user-tracking.js';

export function setup() {
  return userTrackingSetup();
}

export default function spikeIteration(data) {
  runIteration(data);
}

export function handleSummary(data) {
  return makeHandleSummary('spike')(data);
}
