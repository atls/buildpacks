#!/usr/bin/env bash
set -e

BUILDER_DIR="${1:-base}"
DIR=$(cd "$(dirname "$0")" && pwd)

pack builder create "atlantislab/builder-${BUILDER_DIR}:24" --pull-policy never --verbose --config "${DIR}/${BUILDER_DIR}/builder.toml"
