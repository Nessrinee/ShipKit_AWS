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

{{/* Validate required values at render time */}}

{{- define "shipkit.validateValues" -}}
{{- if not .Values.backend.image.tag -}}
{{- fail "backend.image.tag is required. Pass it via --set backend.image.tag=YOUR_TAG" -}}
{{- end -}}
{{- if not .Values.frontend.image.tag -}}
{{- fail "frontend.image.tag is required. Pass it via --set frontend.image.tag=YOUR_TAG" -}}
{{- end -}}
{{- end -}}