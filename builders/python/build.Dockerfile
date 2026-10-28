FROM run_image

USER root

RUN --mount=from=heroku,source=heroku-26-build,target=/build /build/setup.sh

USER heroku

ENV CNB_USER_ID=1000 \
    CNB_GROUP_ID=1000 \
    CNB_STACK_ID=heroku-26
