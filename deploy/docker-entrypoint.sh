#!/bin/sh
set -e

# Runtime API URL — read by the SPA from /config.json (see frontend/*/src/lib/apiBase.ts).
# Set at deploy time (compose / kubectl), not at image build.
#
#   OSSPILOT_API_URL          preferred
#   VITE_TENANT_API_URL       legacy alias (tenant-web)
#   VITE_OPS_API_URL          legacy alias (ops-web)

API_URL="${OSSPILOT_API_URL:-${VITE_TENANT_API_URL:-${VITE_OPS_API_URL:-}}}"
HTML_DIR="${OSSPILOT_HTML_DIR:-/usr/share/nginx/html}"
CONFIG_PATH="${HTML_DIR}/config.json"

if [ -n "$API_URL" ]; then
  API_URL_JSON=$(printf '%s' "$API_URL" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g')
  printf '{"apiUrl":"%s"}\n' "$API_URL_JSON" >"$CONFIG_PATH"
  echo "[Entrypoint] wrote ${CONFIG_PATH} apiUrl=${API_URL}"
else
  echo "[Entrypoint] OSSPILOT_API_URL not set; frontend uses Vite dev .env or same-origin /api"
fi

echo "[Entrypoint] osspilot-web nginx"
exec "$@"
