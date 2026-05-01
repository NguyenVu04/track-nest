// Smoke test — 1 VU × 30 s.
// Verifies all 7 RPCs work correctly before running heavier scenarios.
// Run from test/k6/:  k6 run scripts/user-tracking/smoke.js

export { smokeOptions as options } from '../../lib/options.js';
import {
  setup as userTrackingSetup,
  runIteration,
  makeHandleSummary,
} from '../../lib/scenarios/user-tracking.js';

export function setup() {
  return userTrackingSetup();
}

export default function smokeIteration(data) {
  runIteration(data);
}

export function handleSummary(data) {
  return makeHandleSummary('smoke')(data);
}
