# Build packs

[<img src="https://img.shields.io/static/v1?style=for-the-badge&label=%40atls%2Fcode-service&message=0.0.25&labelColor=ECEEF5&color=D7DCEB">](https://npmjs.com/package/@atls/code-service) [<img src="https://img.shields.io/static/v1?style=for-the-badge&label=%40atls%2Fschematics&message=0.0.21&labelColor=ECEEF5&color=D7DCEB">](https://npmjs.com/package/@atls/schematics)

## Порядок обновления версии `NodeJS` базового билдера

Текущий production baseline: `Node.js 24 LTS`.

Docker-релиз выполняется только через GitHub Actions workflow `Docker release`.
Для публикации workflow использует Docker Hub secrets `DOCKERHUB_USERNAME` и `DOCKERHUB_TOKEN`.

1. В `.github/workflows/docker-release.yaml` проверить `node_image`, `expected_node_major` и `builder_tag`.
2. Запустить workflow `Docker release` через `workflow_dispatch`.
3. Дождаться прохождения встроенной проверки опубликованных образов.
4. Проверить наличие нового тега в [Docker Hub](https://hub.docker.com/r/atlantislab/builder-base/tags).

Workflow публикует:

1. `atlantislab/stack-node:base`
2. `atlantislab/stack-node:build`
3. `atlantislab/stack-node:run`
4. `atlantislab/buildpack-*`
5. `atlantislab/builder-base:<builder_tag>`

## Runtime запуск Yarn PnP ESM workspace

`buildpack-yarn-workspace-start` формирует launch layer с `NODE_OPTIONS` для workspace без `node_modules`.

Если в приложении есть `.pnp.cjs`, buildpack добавляет его через `--require`.
Если в приложении есть `.pnp.loader.mjs`, buildpack добавляет его через `--loader`.
Source maps включаются через `--enable-source-maps`.

Прикладной `package.json` не должен дублировать эти флаги в `start`-команде. Для ESM workspace достаточно запускать собранную точку входа, например `node dist/index.js`.
