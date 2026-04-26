/**
 * Shared options builder for k6 scripts.
 *
 * Supports consistent scaling across all tests via env vars:
 * - K6_VU_SCALE: multiply VU targets (default: 1)
 * - K6_DURATION_SCALE: multiply stage/duration times (default: 1)
 * - K6_MAX_VUS_PER_INSTANCE: cap VUs per worker (default: 0 = no cap)
 * - K6_FORCE_VUS: override smoke VUs
 * - K6_FORCE_DURATION: override smoke duration
 */

function parseNumber(name, fallback) {
  const raw = __ENV[name];
  if (raw === undefined || raw === null || raw === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function clampTarget(target, maxVusPerInstance) {
  if (!Number.isFinite(maxVusPerInstance) || maxVusPerInstance <= 0) return target;
  return Math.min(target, Math.max(0, Math.floor(maxVusPerInstance)));
}

function scaleDuration(duration, factor) {
  if (!duration || factor === 1) return duration;
  const match = String(duration).trim().match(/^(\d+(?:\.\d+)?)(ms|s|m|h)$/);
  if (!match) return duration;

  const amount = Number(match[1]);
  const unit = match[2];
  const scaled = Math.max(0.1, amount * factor);

  if (unit === 'ms') return `${Math.max(1, Math.round(scaled))}ms`;
  if (Number.isInteger(scaled)) return `${scaled}${unit}`;
  return `${scaled.toFixed(1)}${unit}`;
}

function scaledStages(stages, vuScale, durationScale, maxVusPerInstance) {
  return stages.map((stage) => ({
    duration: scaleDuration(stage.duration, durationScale),
    target: clampTarget(Math.max(0, Math.round(stage.target * vuScale)), maxVusPerInstance),
  }));
}

export function createSmokeOptions({ vus, duration, thresholds }) {
  const vuScale = parseNumber('K6_VU_SCALE', 1);
  const maxVusPerInstance = parseNumber('K6_MAX_VUS_PER_INSTANCE', 0);

  const forceVus = __ENV.K6_FORCE_VUS;
  const forceDuration = __ENV.K6_FORCE_DURATION;
  const scaledVus = clampTarget(Math.max(1, Math.round(vus * vuScale)), maxVusPerInstance);

  return {
    vus: forceVus ? Math.max(1, Number(forceVus)) : scaledVus,
    duration: forceDuration || duration,
    thresholds,
  };
}

export function createStageOptions({ stages, thresholds }) {
  const vuScale = parseNumber('K6_VU_SCALE', 1);
  const durationScale = parseNumber('K6_DURATION_SCALE', 1);
  const maxVusPerInstance = parseNumber('K6_MAX_VUS_PER_INSTANCE', 0);

  return {
    stages: scaledStages(stages, vuScale, durationScale, maxVusPerInstance),
    thresholds,
  };
}
