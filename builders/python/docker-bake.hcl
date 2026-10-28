variable "PLATFORMS" {
  type    = list(string)
  default = ["linux/amd64", "linux/arm64"]
}

variable "HEROKU_BASE_IMAGES_CONTEXT" {
  default = "https://github.com/heroku/base-images.git#main"
}

variable "UBUNTU_IMAGE" {
  default = "ubuntu.azurecr.io/ubuntu:26.04"
}

variable "BUILD_IMAGE_TAGS" {
  type    = list(string)
  default = ["ghcr.io/atls/builder-python-build:local"]
}

variable "RUN_IMAGE_TAGS" {
  type    = list(string)
  default = ["ghcr.io/atls/builder-python-run:local"]
}

variable "RUN_IMAGE_CONTEXT" {
  default = "target:builder-python-run"
}

target "builder-python-run" {
  context    = "."
  dockerfile = "builders/python/run.Dockerfile"
  contexts = {
    heroku = HEROKU_BASE_IMAGES_CONTEXT
  }
  args = {
    UBUNTU_IMAGE = UBUNTU_IMAGE
  }
  platforms = PLATFORMS
  pull      = true
  tags      = RUN_IMAGE_TAGS
}

target "builder-python-build" {
  context    = "."
  dockerfile = "builders/python/build.Dockerfile"
  contexts = {
    heroku    = HEROKU_BASE_IMAGES_CONTEXT
    run_image = RUN_IMAGE_CONTEXT
  }
  platforms = PLATFORMS
  pull      = true
  tags      = BUILD_IMAGE_TAGS
}
