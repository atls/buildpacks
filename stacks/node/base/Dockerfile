ARG node_image=node:26-slim
FROM ${node_image}

ARG cnb_uid=1001
ARG cnb_gid=1001
ARG stack_id=tech.atlantislab.stacks.node
ARG corepack_version=0.35.0
ARG yarn_version=4.1.1

ENV COREPACK_HOME=/opt/corepack

# Create user and group
RUN groupadd cnb --gid ${cnb_gid} && \
  useradd --uid ${cnb_uid} --gid ${cnb_gid} -m -s /bin/bash cnb

RUN apt-get update && \
  apt-get install -y --no-install-recommends ca-certificates && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

RUN mkdir -p ${COREPACK_HOME} && \
  npm install -g corepack@${corepack_version} && \
  corepack enable && \
  corepack prepare yarn@${yarn_version} --activate && \
  chown -R ${cnb_uid}:${cnb_gid} ${COREPACK_HOME}

LABEL io.buildpacks.base.distro.name=Debian
LABEL io.buildpacks.base.distro.version=trixie
LABEL io.buildpacks.stack.id=${stack_id}

# Set required CNB information
ENV CNB_USER_ID=${cnb_uid}
ENV CNB_GROUP_ID=${cnb_gid}
ENV CNB_STACK_ID=${stack_id}
