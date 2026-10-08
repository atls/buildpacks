#!/usr/bin/env bash

set -euo pipefail

if [[ "$#" -ne 3 ]]; then
  echo "usage: $0 <buildpack-dir> <stage-dir> <package-config>" >&2
  exit 64
fi

source_dir="$1"
stage_dir="$2"
package_config="$3"

: "${RELEASE_VERSION:?RELEASE_VERSION must be supplied by semantic-release}"

if [[ ! -f "${source_dir}/buildpack.toml" || ! -f "${source_dir}/package.toml" ]]; then
  echo "buildpack.toml and package.toml are required in ${source_dir}" >&2
  exit 1
fi

source_dir="$(cd "${source_dir}" && pwd)"
mkdir -p "$(dirname "${stage_dir}")" "$(dirname "${package_config}")"
stage_parent="$(cd "$(dirname "${stage_dir}")" && pwd)"
config_parent="$(cd "$(dirname "${package_config}")" && pwd)"
stage_dir="${stage_parent}/$(basename "${stage_dir}")"
package_config="${config_parent}/$(basename "${package_config}")"

rm -rf "${stage_dir}"
mkdir -p "${stage_dir}"

envsubst "\${RELEASE_VERSION}" < "${source_dir}/buildpack.toml" > "${stage_dir}/buildpack.toml"

if [[ -d "${source_dir}/bin" ]]; then
  cp -R "${source_dir}/bin" "${stage_dir}/bin"
fi

if [[ -f "${source_dir}/package.json" ]]; then
  cp "${source_dir}/package.json" "${stage_dir}/package.json"
fi

if [[ -d "${source_dir}/bin" ]] && grep -RqsF "../dist/index" "${source_dir}/bin"; then
  (cd "${source_dir}" && yarn build)

  if [[ ! -f "${source_dir}/dist/index.js" ]]; then
    echo "expected ${source_dir}/dist/index.js after build" >&2
    exit 1
  fi

  cp -R "${source_dir}/dist" "${stage_dir}/dist"
fi

export BUILDPACK_DIR="${stage_dir}"
envsubst "\${RELEASE_VERSION} \${BUILDPACK_DIR}" < "${source_dir}/package.toml" > "${package_config}"
