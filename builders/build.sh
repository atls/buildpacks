#!/usr/bin/env bash
set -e

BUILDER_DIR="${1:-base}"

pack builder create "atlantislab/builder-${BUILDER_DIR}:22" --verbose --config "./${BUILDER_DIR}/builder.toml" --publish
