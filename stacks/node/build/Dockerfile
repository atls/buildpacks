ARG base_image
FROM ${base_image}

RUN apt-get update && \
  apt-get install -y --no-install-recommends build-essential python3 libstdc++6 libpq-dev && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*
