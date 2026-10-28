variable "TAGS" {
  type    = list(string)
  default = ["ghcr.io/atls/builder-python:local"]
}

variable "PLATFORMS" {
  type    = list(string)
  default = ["linux/amd64", "linux/arm64"]
}

variable "UPSTREAM_BUILDER" {
  default = "public.ecr.aws/heroku/builder:26"
}

target "builder-python" {
  context    = "."
  dockerfile = "builders/python/Dockerfile"
  args = {
    UPSTREAM_BUILDER = UPSTREAM_BUILDER
  }
  platforms = PLATFORMS
  pull      = true
  tags      = TAGS
}
