#!/usr/bin/env bash
# Install the checked-out source into an empty staging directory.
set -euo pipefail
source_root=$(cd "$(dirname "$0")/.." && pwd)
mkdir -p "$1"
cd "$1"
if [[ -n "$(ls -A)" ]]; then
  echo "Skill staging directory must be empty." >&2
  exit 1
fi
DISABLE_TELEMETRY=1 npx --yes skills@1.9.0 add "$source_root" --skill '*' --agent codex --copy --yes
