#!/usr/bin/env bash
set -e

BUILDER_DIR="${1:-base}"

pack builder create "atlantislab/builder-${BUILDER_DIR}:buster-20.11" --config "./${BUILDER_DIR}/builder.toml"
