#!/usr/bin/env sh
# Optional local-only offline launcher; requires Node.js 20+.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'Node.js 20+ is required. You can still open index.html directly.'
  exit 1
fi
exec node ./gallery-local-server.cjs
