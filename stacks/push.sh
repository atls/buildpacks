#!/usr/bin/env bash
set -e

# Префиксы и директории (дублируются из предыдущего скрипта)
ID_PREFIX="tech.atlantislab.stacks"
DEFAULT_PREFIX=atlantislab/stack
REPO_PREFIX=${DEFAULT_PREFIX}
STACK_DIR="${1:-node}"
DIR=$(cd $(dirname $0) && pwd)
IMAGE_DIR="${DIR}/${STACK_DIR}"
TAG=$(basename "${IMAGE_DIR}")
BASE_IMAGE=${REPO_PREFIX}-${TAG}:base
RUN_IMAGE=${REPO_PREFIX}-${TAG}:run
BUILD_IMAGE=${REPO_PREFIX}-${TAG}:build

# Пуш базового образа
if [[ "$(docker images -q ${BASE_IMAGE} 2> /dev/null)" != "" ]]; then
  echo "PUSHING ${BASE_IMAGE}..."
  docker push "${BASE_IMAGE}"
fi

# Пуш build-образа
echo "PUSHING ${BUILD_IMAGE}..."
docker push "${BUILD_IMAGE}"

# Пуш run-образа
echo "PUSHING ${RUN_IMAGE}..."
docker push "${RUN_IMAGE}"

# Вывод информации о запушенных образах
echo
echo "IMAGES PUSHED!"
echo "Images:"
for IMAGE in "${BASE_IMAGE}" "${BUILD_IMAGE}" "${RUN_IMAGE}"; do
  echo "    ${IMAGE}"
done
