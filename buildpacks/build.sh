#!/usr/bin/env bash
set -e

cwd=$PWD

yarn workspace @atls/buildpack-yarn-install build
cd "${cwd}/yarn-install" && pack buildpack package atlantislab/buildpack-yarn-install:0.1.1 --config ./package.toml --publish

yarn workspace @atls/buildpack-yarn-cache build
cd "${cwd}/yarn-cache" && pack buildpack package atlantislab/buildpack-yarn-cache:0.1.1 --config ./package.toml --publish

yarn workspace @atls/buildpack-yarn-workspace-start build
cd "${cwd}/yarn-workspace-start" && pack buildpack package atlantislab/buildpack-yarn-workspace-start:0.1.1 --config ./package.toml --publish

cd "${cwd}/yarn-workspace" && pack buildpack package atlantislab/buildpack-yarn-workspace:0.1.1 --config ./package.toml --target 'linux/amd64' --target 'linux/arm64' --publish
