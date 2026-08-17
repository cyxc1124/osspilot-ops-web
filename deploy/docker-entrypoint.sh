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

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g'
}

if [ -n "$API_URL" ]; then
  API_URL_JSON=$(json_escape "$API_URL")
  printf '{"apiUrl":"%s"}\n' "$API_URL_JSON" >"$CONFIG_PATH"
  echo "[Entrypoint] wrote ${CONFIG_PATH} apiUrl=${API_URL}"
else
  echo "[Entrypoint] OSSPILOT_API_URL not set; frontend uses Vite dev .env or same-origin /api"
fi

SHORT_COMMIT=$(printf '%s' "$GIT_COMMIT" | cut -c1-8)
VERSION="dev"
if [ -n "$GIT_TAG" ]; then
  VERSION="$GIT_TAG"
elif [ -n "$GIT_BRANCH" ] && [ -n "$SHORT_COMMIT" ]; then
  VERSION="${GIT_BRANCH}@${SHORT_COMMIT}"
elif [ -n "$GIT_BRANCH" ]; then
  VERSION="$GIT_BRANCH"
elif [ -n "$SHORT_COMMIT" ]; then
  VERSION="$SHORT_COMMIT"
fi
printf '{"version":"%s","git_tag":"%s","git_branch":"%s","git_commit":"%s","build_time":"%s"}\n' \
  "$(json_escape "$VERSION")" \
  "$(json_escape "$GIT_TAG")" \
  "$(json_escape "$GIT_BRANCH")" \
  "$(json_escape "$SHORT_COMMIT")" \
  "$(json_escape "$BUILD_TIME")" \
  >"${HTML_DIR}/version.json"

echo "[Entrypoint] osspilot-web nginx"
exec "$@"
