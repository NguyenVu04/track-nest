# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Chart Layout

Umbrella chart (`tracknest`) with four active local subcharts and three packaged external dependencies. The frontend and nginx workloads have been removed — the Next.js UI is deployed externally and Envoy is the sole ingress proxy.

```
helm/
├── Chart.yaml                    # Umbrella; declares all dependencies
├── Chart.lock
├── values.yaml                   # Non-secret config defaults
├── values-dev.yaml               # Dev overrides: 1 replica, ClusterIP, no observability
├── values-prod.yaml              # Prod overrides: HPA, PDB, Loki S3
├── values-secrets.example.yaml  # Template for CI/CD secret injection (safe to commit)
├── templates/
│   ├── secrets.yaml              # Renders tracknest-secrets from .Values.secrets
│   ├── _helpers.tpl
│   └── NOTES.txt
└── charts/
    ├── services/     # Spring Boot: user-tracking, criminal-reports, emergency-ops
    ├── gateway/      # Envoy (sole ingress proxy — handles both domains)
    ├── keycloak/     # Keycloak with realm ConfigMaps
    ├── kube-prometheus-stack-83.2.0.tgz
    ├── loki-6.29.0.tgz
    └── promtail-6.16.6.tgz
```

## Common Commands

```bash
# Validate templates (dry-run, no cluster needed)
helm template tracknest . -f values-secrets.yaml

# Lint
helm lint . -f values-secrets.yaml

# Install/upgrade
helm upgrade --install tracknest . \
  -f values-secrets.yaml \
  -n tracknest --create-namespace

# Render a single template
helm template tracknest . -f values-secrets.yaml \
  --show-only charts/gateway/templates/envoy-configmap.yaml

# Re-package after adding a new subchart or bumping external versions
helm dependency update .
```

**Pre-deploy prerequisites** (provision once, not managed by this chart):
- Kafka JKS truststore as a Secret — see `templates/NOTES.txt` for the exact `kubectl create secret` command.
- TLS cert Secret named `cf-cert` (Cloudflare origin cert) in the `tracknest` namespace.

## Secrets Architecture

All credentials are injected at deploy time via a `values-secrets.yaml` file that is **never committed**. Copy `values-secrets.example.yaml`, fill in the values, and pass it as the last `-f` flag so it overrides defaults.

`templates/secrets.yaml` renders a single `tracknest-secrets` Opaque Secret from `.Values.secrets`. Every service pod mounts it via `envFrom`. No credentials belong in `values.yaml`, `values-dev.yaml`, or `values-prod.yaml`.

**CI/CD pattern (GitHub Actions):**
```yaml
- name: Write secrets file
  run: |
    cat > helm/values-secrets.yaml <<EOF
    secrets:
      USER_TRACKING_DB_PASSWORD: "${{ secrets.USER_TRACKING_DB_PASSWORD }}"
      # ... all keys from values-secrets.example.yaml
    EOF

- name: Deploy
  run: |
    helm upgrade --install tracknest ./helm \
      -f helm/values-secrets.yaml \
      -n tracknest --create-namespace
```

Add `values-secrets.yaml` to `.gitignore`.

## Envoy — Single Ingress Proxy

Envoy handles **all external traffic** on two domains via domain-based virtual hosts:

| Domain | Listener | Routes |
|--------|----------|--------|
| `tracknestapp.org` | TLS :8800 → svc :443 | `/auth/` → Keycloak (no JWT); `/` → 404 |
| `api.tracknestapp.org` / `*` | TLS :8800 → svc :443 | `/emergency-ops/` REST, `/criminal-reports/` REST, `/` gRPC (all JWT-gated) |
| any | plain :8080 → svc :80 | 301 redirect to HTTPS |

Security headers (HSTS, CSP primitives, X-Frame-Options, etc.) are applied at the virtual-host level for `tracknestapp.org`. CORS is applied on the API virtual host only.

**JWT auth rules** are evaluated top-to-bottom in the `jwt_authn` filter. `/auth/` is explicitly allowed without a token before the catch-all `/ → keycloak_public` rule, so Keycloak's own endpoints are never blocked.

**When adding a new backend route**, edit `charts/gateway/templates/envoy-configmap.yaml`:
1. Add a `cluster` entry under `static_resources.clusters`.
2. Add a `route` entry in the appropriate `virtual_host` (keycloak or api_services).
3. Add a JWT `rule` if authentication behaviour differs from the default.

The Envoy ConfigMap checksum annotation on the Deployment (`checksum/config`) ensures pods roll on every config change.

## Per-Subchart Notes

### services/
Shared env vars (Spring profile, CORS, Kafka bootstrap, Redis) come from `services.commonEnv` in `charts/services/templates/_helpers.tpl`. Per-service env vars (DB URL, ports) are inline in each `*-deployment.yaml`. Health probes hit `/actuator/health/{liveness,readiness}` on port **8081** (management port).

### keycloak/
Realm JSON is stored in a Kubernetes Secret (`keycloak-realm-config`), not a ConfigMap. Content is injected at deploy time via `--set-file keycloak.keycloak.realmConfig.public=<path>` and `--set-file keycloak.keycloak.realmConfig.restricted=<path>`, or as literal block scalars in `values-secrets.yaml` (see `values-secrets.example.yaml`). Realm import runs only at first pod start — if you change a realm file, delete the Keycloak pod and its database volume, or use the Admin API to re-import manually. `start` vs `start-dev` is controlled by `.Values.keycloak.keycloak.startCommand`.

### Observability
Disabled in dev. In prod: Prometheus scrapes via ServiceMonitor resources, AlertManager routes to Telegram (bot token from `tracknest-secrets`), Loki uses DigitalOcean Spaces (S3 credentials from `values-secrets.yaml` under `loki.loki.storage_config.aws`), Promtail runs as a DaemonSet parsing structured Spring log lines.

## Image Tagging

All service images: `nguyenvu04/tracknest-<service>:v<semver>`. Bump the tag in the relevant subchart's `values.yaml` when cutting a release.
