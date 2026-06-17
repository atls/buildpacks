# Build packs

[<img src="https://img.shields.io/static/v1?style=for-the-badge&label=%40atls%2Fcode-service&message=0.0.25&labelColor=ECEEF5&color=D7DCEB">](https://npmjs.com/package/@atls/code-service) [<img src="https://img.shields.io/static/v1?style=for-the-badge&label=%40atls%2Fschematics&message=0.0.21&labelColor=ECEEF5&color=D7DCEB">](https://npmjs.com/package/@atls/schematics)

## Порядок обновления версий `NodeJS` базового билдера

Поддерживаемые Node lines для Docker-релиза задаются в `.github/docker-release-node-lines.json`.
Поле `default` должно совпадать с `ARG node_version` в `stacks/node/base/Dockerfile`; этот default управляет moving aliases без Node major.

Docker-релиз выполняется через GitHub Actions workflow `Docker release` после merge в `master`.
Для публикации workflow использует `GITHUB_TOKEN` с доступом `packages: write` и публикует образы в GitHub Container Registry.
Для Docker Scout scan workflow использует `DOCKERHUB_USERNAME` и `DOCKERHUB_TOKEN` только как Docker Scout credentials.

1. В `.github/docker-release-node-lines.json` добавить или удалить supported Node major.
2. Если меняется default baseline, обновить `default` в `.github/docker-release-node-lines.json` и `ARG node_version` в `stacks/node/base/Dockerfile`.
3. Вмержить PR с релизными изменениями в `master`.
4. Дождаться прохождения workflow `Docker release`.
5. Проверить наличие нового тега в [GHCR](https://github.com/orgs/atls/packages/container/package/builder-base).

Workflow публикует:

1. immutable stack tags `ghcr.io/atls/stack-node:base-<Node major>-<sha>`, `build-<Node major>-<sha>`, `run-<Node major>-<sha>`
2. channel stack tags `ghcr.io/atls/stack-node:base-<Node major>`, `build-<Node major>`, `run-<Node major>` для каждой supported Node line
3. default moving aliases `ghcr.io/atls/stack-node:base`, `build`, `run` только для Node major из `default`
4. semver buildpack tags `ghcr.io/atls/buildpack-*:<version>`
5. buildpack group channel tags `ghcr.io/atls/buildpack-yarn-workspace:<Node major>` для каждой supported Node line
6. immutable builder tags `ghcr.io/atls/builder-base:<Node major>-<sha>`
7. builder channel tags `ghcr.io/atls/builder-base:<Node major>`, собранные из stack tags той же Node line

Semver buildpack tags остаются pin/rollback-артефактами. Node major channel tags можно использовать в потребителях, которым нужен актуальный проверенный buildpack под выбранную Node line без обновления patch-версии после каждого релиза.

## Порядок обновления версий CNB buildpack-компонентов

Версии buildpack и extension компонентов ведутся через `release-please-config.json` и `.release-please-manifest.json`.
Release PR создаёт GitHub Actions workflow `Release Please` после merge в `master`.
GitHub release и tag создаёт `Release Please GitHub release` только после successful `Docker release`.
Workflow использует `release-please-action` с правами `contents: write`, `issues: write` и `pull-requests: write`.
Для создания release PR используется `PAT_token`, чтобы созданные PR запускали обычные проверки `pull_request`.
Buildpack-компоненты связаны через `release-please` `linked-versions` group `cnb-buildpack-family`.
В эту группу входит `libcnb`, поэтому изменение общей CNB-библиотеки поднимает версии зависящих buildpack-компонентов тем же release PR.

Composite buildpack `buildpack-yarn-workspace` получает refs на связанные component buildpacks в том же release PR через `release-please` generic markers в `buildpacks/yarn-workspace/package.toml` и `buildpacks/yarn-workspace/buildpack.toml`.
Штатный CNB-инструмент `jam update-buildpack` остаётся локальной командой для сверки или ручной синхронизации с уже опубликованными component buildpack tags:

```bash
yarn run update:buildpack-refs
```

Команда обновляет `buildpacks/yarn-workspace/package.toml` и `buildpacks/yarn-workspace/buildpack.toml`.

Extension-компоненты связаны через `release-please` `linked-versions` group `cnb-extension-family`.
`builders/base/builder.toml` получает refs на связанные extension images в том же release PR, а Docker release берёт publish tag из соответствующего `extension.toml`.

`jam update-builder` сейчас не используется.
`builder-base` остаётся base builder: он содержит lifecycle, stack images и extensions, а `buildpack-yarn-workspace` выбирается Raijin image pack.
Кроме того, `jam update-builder` ожидает semver tags для build/run images, а `stack-node` публикуется channel/SHA тегами вроде `build-24`, `run-24` и `build-24-<sha>`.

## Runtime запуск Yarn PnP ESM workspace

`buildpack-yarn-workspace-start` формирует launch layer с `NODE_OPTIONS` для workspace без `node_modules`.

Если в приложении есть `.pnp.cjs`, buildpack добавляет его через `--require`.
Если в приложении есть `.pnp.loader.mjs`, buildpack добавляет его через `--loader`.
Source maps включаются через `--enable-source-maps`.

Прикладной `package.json` не должен дублировать эти флаги в `start`-команде. Для ESM workspace достаточно запускать собранную точку входа, например `node dist/index.js`.
