#!/usr/bin/env bash

set -euo pipefail

if ! command -v jam >/dev/null 2>&1; then
  echo "jam is required: https://github.com/paketo-buildpacks/jam" >&2
  exit 1
fi

jam update-buildpack \
  --buildpack-file buildpacks/yarn-workspace/buildpack.toml \
  --package-file buildpacks/yarn-workspace/package.toml \
  --patch-only

python3 scripts/verify-cnb-version-refs.py
