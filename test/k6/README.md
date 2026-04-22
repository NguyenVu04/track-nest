# k6 Test Suite

This folder contains all TrackNest performance tests for:
- `web`
- `criminal-reports`
- `emergency-ops`
- `user-tracking`

## Consistent Runtime Controls

All scripts now share the same runtime scaling knobs:

- `K6_VU_SCALE`: multiply VU targets (`default=1`)
- `K6_DURATION_SCALE`: multiply test durations (`default=1`)
- `K6_MAX_VUS_PER_INSTANCE`: cap VUs per worker (`default=0`, no cap)
- `K6_FORCE_VUS`: force smoke-test VU count
- `K6_FORCE_DURATION`: force smoke-test duration

Examples (PowerShell):

```powershell
$env:K6_VU_SCALE = "2"
$env:K6_DURATION_SCALE = "0.5"
k6 run scripts/emergency-ops/load.js
```

```powershell
$env:K6_FORCE_VUS = "5"
$env:K6_FORCE_DURATION = "2m"
k6 run scripts/web/smoke.js
```

## Run With npm Scripts

```powershell
npm run web:smoke
npm run emergency:load
npm run tracking:stress
```

## Scale To 1000+ Concurrent Users

Single-machine bottlenecks are common around 100-200 VUs depending on CPU and memory. Use segmented workers to split one test across multiple k6 processes.

### Local distributed run (Docker workers)

```powershell
./run-distributed.ps1 -ScriptPath scripts/emergency-ops/stress.js -Workers 10
```

This runs 10 k6 workers with execution segments (`0:1/10`, `1/10:2/10`, ...), so a `target: 1000` stage is split to about 100 VUs per worker.

Optional flags:

```powershell
./run-distributed.ps1 `
  -ScriptPath scripts/user-tracking/stress.js `
  -Workers 10 `
  -EnvFile .env `
  -DockerNetwork k6_default `
  -ExtraArgs "--out json=results/raw.json"
```

## Notes

- For realistic 1000-user tests, run workers on multiple machines if one host is saturated.
- Keep Grafana/InfluxDB running with `docker-compose.yaml` if you want persistent dashboards.
- If you use `target: 1000`, prefer at least 10 workers (`~100 VUs/worker`).
