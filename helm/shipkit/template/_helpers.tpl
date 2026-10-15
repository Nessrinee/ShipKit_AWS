{{/*
Common labels applied to every ressources
*/}}
{{- define "shipkit.labels" -}}
app.kubernetes.io/managed-by: {{ .Release.Service}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
project: shipkit
environment: production
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "shipkit.backend.selectorLabels" -}}
app: shipkit-backend
app.kubernetes.io/name: shipkit-backend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "shipkit.frontend.selectorLabels" -}}
app: shipkit-frontend
app.kubernetes.io/name: shipkit-frontend
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}