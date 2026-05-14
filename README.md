# Build packs

[<img src="https://img.shields.io/static/v1?style=for-the-badge&label=%40atls%2Fcode-service&message=0.0.25&labelColor=ECEEF5&color=D7DCEB">](https://npmjs.com/package/@atls/code-service) [<img src="https://img.shields.io/static/v1?style=for-the-badge&label=%40atls%2Fschematics&message=0.0.21&labelColor=ECEEF5&color=D7DCEB">](https://npmjs.com/package/@atls/schematics)

## Порядок обновления версии `NodeJS` базового билдера

Текущий production baseline берётся из `ARG node_image` в `stacks/node/base/Dockerfile`.

Docker-релиз выполняется через GitHub Actions workflow `Docker release` после merge в `master`.
Для публикации workflow использует Docker Hub secrets `DOCKERHUB_USERNAME` и `DOCKERHUB_TOKEN`.

1. В `stacks/node/base/Dockerfile` обновить `ARG node_image`.
2. Вмержить PR с релизными изменениями в `master`.
3. Дождаться прохождения workflow `Docker release`.
4. Проверить наличие нового тега в [Docker Hub](https://hub.docker.com/r/atlantislab/builder-base/tags).

Workflow публикует:

1. `atlantislab/stack-node:base`
2. `atlantislab/stack-node:build`
3. `atlantislab/stack-node:run`
4. `atlantislab/buildpack-*`
5. `atlantislab/builder-base:<Node major>`

## Runtime запуск Yarn PnP ESM workspace

`buildpack-yarn-workspace-start` формирует launch layer с `NODE_OPTIONS` для workspace без `node_modules`.

Если в приложении есть `.pnp.cjs`, buildpack добавляет его через `--require`.
Если в приложении есть `.pnp.loader.mjs`, buildpack добавляет его через `--loader`.
Source maps включаются через `--enable-source-maps`.

Прикладной `package.json` не должен дублировать эти флаги в `start`-команде. Для ESM workspace достаточно запускать собранную точку входа, например `node dist/index.js`.
