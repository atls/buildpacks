#!/usr/bin/env bash

set -euo pipefail

if [[ "$#" -ne 2 ]]; then
  echo "usage: $0 <buildpack-archive> <buildpack-dir>" >&2
  exit 64
fi

archive="$1"
source_dir="$2"

if [[ ! -f "${archive}" ]]; then
  echo "archive does not exist: ${archive}" >&2
  exit 1
fi

if [[ ! -f "${source_dir}/buildpack.toml" ]]; then
  echo "buildpack.toml is required in ${source_dir}" >&2
  exit 1
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "${tmp_dir}"' EXIT

oci_dir="${tmp_dir}/oci"
root_dir="${tmp_dir}/root"
mkdir -p "${oci_dir}" "${root_dir}"

tar -xf "${archive}" -C "${oci_dir}"

for blob in "${oci_dir}"/blobs/sha256/*; do
  if tar -tf "${blob}" >/dev/null 2>&1; then
    tar -xf "${blob}" -C "${root_dir}"
  fi
done

buildpack_id="$(awk -F' *= *' '$1 == "id" { gsub(/"/, "", $2); print $2; exit }' "${source_dir}/buildpack.toml")"
buildpack_version="$(awk -F' *= *' '$1 == "version" { gsub(/"/, "", $2); print $2; exit }' "${source_dir}/buildpack.toml")"

if [[ -z "${buildpack_id}" || -z "${buildpack_version}" ]]; then
  echo "failed to resolve buildpack id/version from ${source_dir}/buildpack.toml" >&2
  exit 1
fi

buildpack_root="${root_dir}/cnb/buildpacks/${buildpack_id}/${buildpack_version}"

if [[ ! -d "${buildpack_root}" ]]; then
  echo "packaged buildpack root is missing: /cnb/buildpacks/${buildpack_id}/${buildpack_version}" >&2
  exit 1
fi

if [[ ! -f "${buildpack_root}/buildpack.toml" ]]; then
  echo "packaged buildpack.toml is missing" >&2
  exit 1
fi

if [[ -d "${source_dir}/bin" ]]; then
  while IFS= read -r -d '' bin_file; do
    relative_path="${bin_file#"${source_dir}/"}"

    if [[ ! -f "${buildpack_root}/${relative_path}" ]]; then
      echo "packaged ${relative_path} is missing" >&2
      exit 1
    fi
  done < <(find "${source_dir}/bin" -type f -print0)
fi

if [[ -d "${source_dir}/bin" ]] && grep -RqsF "../dist/index" "${source_dir}/bin"; then
  if [[ ! -f "${buildpack_root}/dist/index.js" ]]; then
    echo "packaged dist/index.js is missing" >&2
    exit 1
  fi
fi

for unexpected_path in src package.json package.toml; do
  if [[ -e "${buildpack_root}/${unexpected_path}" ]]; then
    echo "unexpected packaged source artifact: ${unexpected_path}" >&2
    exit 1
  fi
done

echo "verified /cnb/buildpacks/${buildpack_id}/${buildpack_version}"
