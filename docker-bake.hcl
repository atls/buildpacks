variable "IMAGE_PREFIX" {
  default = "ghcr.io/atls"
}

variable "STACK_ID" {
  default = "tech.atls.stacks.node"
}

variable "BASE_IMAGE" {
  default = "mcr.microsoft.com/devcontainers/base:debian-12"
}

variable "NODE_VERSION" {
  default = "26"
}

variable "RELEASE_TAG" {
  default = "local"
}

variable "PLATFORMS" {
  default = ["linux/amd64", "linux/arm64"]
}

group "stack" {
  targets = [
    "stack-node-base",
    "stack-node-build",
    "stack-node-run",
  ]
}

target "stack-node-base" {
  context = "stacks/node/base"
  args = {
    base_image   = BASE_IMAGE
    node_version = NODE_VERSION
    stack_id     = STACK_ID
  }
  platforms = PLATFORMS
  tags = ["${IMAGE_PREFIX}/stack-node:base-${RELEASE_TAG}"]
}

target "stack-node-build" {
  context = "stacks/node/build"
  args = {
    base_image = "${IMAGE_PREFIX}/stack-node:base-${RELEASE_TAG}"
  }
  platforms = PLATFORMS
  tags = ["${IMAGE_PREFIX}/stack-node:build-${RELEASE_TAG}"]
}

target "stack-node-run" {
  context = "stacks/node/run"
  args = {
    base_image = "${IMAGE_PREFIX}/stack-node:base-${RELEASE_TAG}"
  }
  platforms = PLATFORMS
  tags = ["${IMAGE_PREFIX}/stack-node:run-${RELEASE_TAG}"]
}
