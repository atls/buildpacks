variable "IMAGE_PREFIX" {
}

variable "STACK_ID" {
}

variable "BASE_IMAGE" {
}

variable "NODE_VERSION" {
}

variable "RELEASE_TAG" {
}

variable "PLATFORMS" {
  type = list(string)
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
  contexts = {
    base_image = "target:stack-node-base"
  }
  args = {
    base_image = "base_image"
  }
  platforms = PLATFORMS
  tags = ["${IMAGE_PREFIX}/stack-node:build-${RELEASE_TAG}"]
}

target "stack-node-run" {
  context = "stacks/node/run"
  contexts = {
    base_image = "target:stack-node-base"
  }
  args = {
    base_image = "base_image"
  }
  platforms = PLATFORMS
  tags = ["${IMAGE_PREFIX}/stack-node:run-${RELEASE_TAG}"]
}
