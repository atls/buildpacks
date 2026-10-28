ARG UBUNTU_IMAGE=ubuntu.azurecr.io/ubuntu:26.04
FROM ${UBUNTU_IMAGE}

# Use Heroku's stack setup for the CNB run image.
RUN --mount=from=heroku,source=heroku-26,target=/build /build/setup.sh

USER heroku

LABEL io.buildpacks.base.distro.name="ubuntu" \
      io.buildpacks.base.distro.version="26.04" \
      io.buildpacks.base.homepage="https://github.com/heroku/base-images" \
      io.buildpacks.base.maintainer="Heroku" \
      io.buildpacks.stack.id="heroku-26" \
      org.opencontainers.image.source="https://github.com/atls/buildpacks"
