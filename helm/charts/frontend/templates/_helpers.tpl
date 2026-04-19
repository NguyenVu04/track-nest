{{- define "web.labels" -}}
app: web
app.kubernetes.io/name: web
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: frontend
app.kubernetes.io/part-of: tracknest
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end -}}

{{- define "web.selectorLabels" -}}
app: web
app.kubernetes.io/name: web
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
