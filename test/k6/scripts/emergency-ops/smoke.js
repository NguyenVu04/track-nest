// Smoke test — 1 VU × 30 s.
// Verifies all 4 emergency-ops HTTP endpoints respond correctly.
// Run from test/k6/:  k6 run scripts/emergency-ops/smoke.js

export { eoSmokeOptions as options } from '../../lib/options.js';
import {
  setup as eoSetup,
  runIteration,
  makeHandleSummary,
} from '../../lib/scenarios/emergency-ops.js';

export function setup() {
  return eoSetup();
}

export default function smokeIteration(data) {
  runIteration(data);
}

export function handleSummary(data) {
  return makeHandleSummary('smoke')(data);
}
