ARG base_image=mcr.microsoft.com/devcontainers/base:debian-12
FROM ${base_image}

ARG cnb_uid=1001
ARG cnb_gid=1001
ARG stack_id=tech.atlantislab.stacks.node
ARG node_version=26
ARG corepack_version=0.35.0
ARG yarn_version=4.1.1

ENV COREPACK_HOME=/opt/corepack

# Create user and group
RUN groupadd cnb --gid ${cnb_gid} && \
  useradd --uid ${cnb_uid} --gid ${cnb_gid} -m -s /bin/bash cnb

RUN apt-get update && \
  apt-get install -y --no-install-recommends ca-certificates curl gnupg && \
  mkdir -p /etc/apt/keyrings && \
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${node_version}.x nodistro main" > /etc/apt/sources.list.d/nodesource.list && \
  apt-get update && \
  apt-get install -y --no-install-recommends nodejs && \
  apt-get purge -y --auto-remove curl gnupg && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

RUN mkdir -p ${COREPACK_HOME} && \
  npm install -g corepack@${corepack_version} && \
  corepack enable && \
  corepack prepare yarn@${yarn_version} --activate && \
  chown -R ${cnb_uid}:${cnb_gid} ${COREPACK_HOME}

LABEL io.buildpacks.base.distro.name=Debian
LABEL io.buildpacks.base.distro.version=bookworm
LABEL io.buildpacks.stack.id=${stack_id}

# Set required CNB information
ENV CNB_USER_ID=${cnb_uid}
ENV CNB_GROUP_ID=${cnb_gid}
ENV CNB_STACK_ID=${stack_id}
