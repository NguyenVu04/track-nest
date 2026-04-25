{{- define "gateway.envoyLabels" -}}
app: envoy
app.kubernetes.io/name: envoy
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: api-gateway
app.kubernetes.io/part-of: tracknest
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end -}}

{{- define "gateway.envoySelector" -}}
app: envoy
app.kubernetes.io/name: envoy
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
