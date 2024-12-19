ARG base_image
FROM ${base_image}

# TODO: move to buildpacks
RUN apt-get update && \
  apt-get install -y --no-install-recommends curl && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*
