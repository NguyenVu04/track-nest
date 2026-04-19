{{/*
Common labels for every resource in the services subchart.
Takes a dict with `.Ctx` (the root context) and `.Name` (service short name).
*/}}
{{- define "services.labels" -}}
app.kubernetes.io/name: {{ .Name }}
app.kubernetes.io/instance: {{ .Ctx.Release.Name }}
app.kubernetes.io/component: backend-service
app.kubernetes.io/part-of: tracknest
app.kubernetes.io/managed-by: {{ .Ctx.Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Ctx.Chart.Name .Ctx.Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end -}}

{{- define "services.selectorLabels" -}}
app: {{ .Name }}
app.kubernetes.io/name: {{ .Name }}
app.kubernetes.io/instance: {{ .Ctx.Release.Name }}
{{- end -}}

{{/*
Shared env block used by every Spring Boot service.
Argument: root context (`.`).
*/}}
{{- define "services.commonEnv" -}}
- name: SPRING_PROFILES_ACTIVE
  value: {{ .Values.springProfile | quote }}

- name: ALLOWED_ORIGINS
  value: {{ .Values.origins | quote }}

- name: POD_NAME
  valueFrom:
    fieldRef:
      fieldPath: metadata.name

- name: POD_UID
  valueFrom:
    fieldRef:
      fieldPath: metadata.uid

- name: POD_NAMESPACE
  valueFrom:
    fieldRef:
      fieldPath: metadata.namespace

- name: KAFKA_SERVER
  value: {{ .Values.kafka.server | quote }}

- name: KAFKA_USERNAME
  valueFrom:
    secretKeyRef:
      name: {{ .Release.Name }}-secrets
      key: KAFKA_USERNAME

- name: KAFKA_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Release.Name }}-secrets
      key: KAFKA_PASSWORD

- name: KAFKA_SSL_TRUSTSTORE_LOCATION
  value: {{ .Values.kafka.truststorePath | quote }}

- name: KAFKA_SSL_TRUSTSTORE_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Release.Name }}-secrets
      key: KAFKA_SSL_TRUSTSTORE_PASSWORD

- name: REDIS_URL
  valueFrom:
    secretKeyRef:
      name: {{ .Release.Name }}-secrets
      key: REDIS_URL
{{- end -}}

{{/*
Probe blocks. Argument: root context (`.`).
*/}}
{{- define "services.livenessProbe" -}}
httpGet:
  path: {{ .Values.defaults.probes.liveness.path }}
  port: {{ .Values.defaults.probes.liveness.port }}
initialDelaySeconds: {{ .Values.defaults.probes.liveness.initialDelaySeconds }}
periodSeconds: {{ .Values.defaults.probes.liveness.periodSeconds }}
timeoutSeconds: {{ .Values.defaults.probes.liveness.timeoutSeconds }}
failureThreshold: {{ .Values.defaults.probes.liveness.failureThreshold }}
{{- end -}}

{{- define "services.readinessProbe" -}}
httpGet:
  path: {{ .Values.defaults.probes.readiness.path }}
  port: {{ .Values.defaults.probes.readiness.port }}
initialDelaySeconds: {{ .Values.defaults.probes.readiness.initialDelaySeconds }}
periodSeconds: {{ .Values.defaults.probes.readiness.periodSeconds }}
timeoutSeconds: {{ .Values.defaults.probes.readiness.timeoutSeconds }}
failureThreshold: {{ .Values.defaults.probes.readiness.failureThreshold }}
{{- end -}}
