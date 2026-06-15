# Build packs

[<img src="https://img.shields.io/static/v1?style=for-the-badge&label=%40atls%2Fcode-service&message=0.0.25&labelColor=ECEEF5&color=D7DCEB">](https://npmjs.com/package/@atls/code-service) [<img src="https://img.shields.io/static/v1?style=for-the-badge&label=%40atls%2Fschematics&message=0.0.21&labelColor=ECEEF5&color=D7DCEB">](https://npmjs.com/package/@atls/schematics)

## Порядок обновления версии `NodeJS` базового билдера

Текущий production baseline берётся из `ARG node_version` в `stacks/node/base/Dockerfile`.

Docker-релиз выполняется через GitHub Actions workflow `Docker release` после merge в `master`.
Для публикации workflow использует `GITHUB_TOKEN` с доступом `packages: write` и публикует образы в GitHub Container Registry.
Для Docker Scout scan workflow использует `DOCKERHUB_USERNAME` и `DOCKERHUB_TOKEN` только как Docker Scout credentials.

1. В `stacks/node/base/Dockerfile` обновить `ARG node_version`.
2. Вмержить PR с релизными изменениями в `master`.
3. Дождаться прохождения workflow `Docker release`.
4. Проверить наличие нового тега в [GHCR](https://github.com/orgs/atls/packages/container/package/builder-base).

Workflow публикует:

1. `ghcr.io/atls/stack-node:base-<Node major>`
2. `ghcr.io/atls/stack-node:build-<Node major>`
3. `ghcr.io/atls/stack-node:run-<Node major>`
4. `ghcr.io/atls/stack-node:base`, `ghcr.io/atls/stack-node:build`, `ghcr.io/atls/stack-node:run` как moving aliases текущего baseline
5. `ghcr.io/atls/buildpack-*`
6. `ghcr.io/atls/builder-base:<Node major>`, собранный из stack tags того же Node major

## Runtime запуск Yarn PnP ESM workspace

`buildpack-yarn-workspace-start` формирует launch layer с `NODE_OPTIONS` для workspace без `node_modules`.

Если в приложении есть `.pnp.cjs`, buildpack добавляет его через `--require`.
Если в приложении есть `.pnp.loader.mjs`, buildpack добавляет его через `--loader`.
Source maps включаются через `--enable-source-maps`.

Прикладной `package.json` не должен дублировать эти флаги в `start`-команде. Для ESM workspace достаточно запускать собранную точку входа, например `node dist/index.js`.
