#!/usr/bin/env bash
set -e

cwd=$PWD

cd "${cwd}/curl" && pack extension package atlantislab/buildpack-extension-curl:0.0.1 --publish
cd "${cwd}/htop" && pack extension package atlantislab/buildpack-extension-htop:0.0.1 --publish
cd "${cwd}/graphql-hive" && pack extension package atlantislab/buildpack-extension-graphql-hive:0.0.1 --publish
