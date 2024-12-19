FROM node:22-slim

ARG cnb_uid=1001
ARG cnb_gid=1001
ARG stack_id=tech.atlantislab.stacks.node

# Create user and group
RUN groupadd cnb --gid ${cnb_gid} && \
  useradd --uid ${cnb_uid} --gid ${cnb_gid} -m -s /bin/bash cnb

RUN apt-get update && \
  apt-get install -y --no-install-recommends ca-certificates && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

LABEL io.buildpacks.base.distro.name=Debian
LABEL io.buildpacks.base.distro.version=bookworm
LABEL io.buildpacks.stack.id=${stack_id}

# Set required CNB information
ENV CNB_USER_ID=${cnb_uid}
ENV CNB_GROUP_ID=${cnb_gid}
ENV CNB_STACK_ID=${stack_id}
