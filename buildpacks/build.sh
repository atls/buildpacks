#!/usr/bin/env bash
set -e

cwd=$PWD

yarn workspace @atls/buildpack-yarn-install build
cd "${cwd}/yarn-install" && pack buildpack package atlantislab/buildpack-yarn-install:0.1.0 --config ./package.toml

yarn workspace @atls/buildpack-yarn-cache build
cd "${cwd}/yarn-cache" && pack buildpack package atlantislab/buildpack-yarn-cache:0.1.0 --config ./package.toml

yarn workspace @atls/buildpack-yarn-workspace-start build
cd "${cwd}/yarn-workspace-start" && pack buildpack package atlantislab/buildpack-yarn-workspace-start:0.1.0 --config ./package.toml

docker push atlantislab/buildpack-yarn-install:0.1.0
docker push atlantislab/buildpack-yarn-cache:0.1.0
docker push atlantislab/buildpack-yarn-workspace-start:0.1.0

cd "${cwd}/yarn-workspace" && pack buildpack package atlantislab/buildpack-yarn-workspace:0.1.0 --config ./package.toml

docker push atlantislab/buildpack-yarn-workspace:0.1.0
