{{/*
Common labels applied to every resource rendered by the umbrella chart.
*/}}
{{- define "tracknest.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: tracknest
{{- end -}}

{{/*
Secret name used by all subcharts for pulling credentials.
*/}}
{{- define "tracknest.secretsName" -}}
{{ .Release.Name }}-secrets
{{- end -}}

{{/*
Secret name holding the Kafka SSL truststore (.jks). Mounted read-only into
JVM services. Provision out-of-band (e.g. `kubectl create secret generic
<release>-certs --from-file=truststore.jks=...`).
*/}}
{{- define "tracknest.certsSecretName" -}}
{{ .Release.Name }}-certs
{{- end -}}
