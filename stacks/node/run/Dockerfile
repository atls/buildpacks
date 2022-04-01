ARG base_image
FROM ${base_image}

# TODO: move to buildpacks
RUN apt-get update && apt-get install -y --no-install-recommends \
  curl ca-certificates  \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN cd /usr/local/bin && curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh"  | bash

# Set required CNB information
ARG stack_id
LABEL io.buildpacks.stack.id="${stack_id}"

# Set user and group (as declared in base image)
USER ${CNB_USER_ID}:${CNB_GROUP_ID}
