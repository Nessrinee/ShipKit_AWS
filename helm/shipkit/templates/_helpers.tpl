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
{{- $backendTag := .Values.backend.image.tag | default "" -}}
{{- if not (regexMatch "^[a-fA-F0-9]{7}-[0-9]+$" $backendTag) -}}
{{- fail "backend.image.tag must match SHA7-BUILD format, e.g. e639c8a-76" -}}
{{- end -}}

{{- $frontendTag := .Values.frontend.image.tag | default "" -}}
{{- if not (regexMatch "^[a-fA-F0-9]{7}-[0-9]+$" $frontendTag) -}}
{{- fail "frontend.image.tag must match SHA7-BUILD format, e.g. e639c8a-76" -}}
{{- end -}}
{{- end -}}
