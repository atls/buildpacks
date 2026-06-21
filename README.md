# Buildpacks

[<img src="https://img.shields.io/static/v1?style=for-the-badge&label=%40atls%2Fcode-service&message=0.0.25&labelColor=ECEEF5&color=D7DCEB">](https://npmjs.com/package/@atls/code-service)
[<img src="https://img.shields.io/static/v1?style=for-the-badge&label=%40atls%2Fschematics&message=0.0.21&labelColor=ECEEF5&color=D7DCEB">](https://npmjs.com/package/@atls/schematics)

## Порядок обновления версий Node.js базового билдера

Поддерживаемые линейки Node.js для Docker-релиза задаются в
`.github/docker-release-node-lines.json`.
Поле `default` должно совпадать с `ARG node_version` в `stacks/node/base/Dockerfile`.
Оно управляет алиасами без номера линейки Node.js.

Docker-релиз выполняет рабочий процесс GitHub Actions Docker release после слияния в
`master`.
Для публикации используется `GITHUB_TOKEN` с доступом `packages: write`.
Образы публикуются в GitHub Container Registry.

Базовый слой стека обновляет установленные Debian-пакеты перед установкой Node.js.
Так релизные образы не наследуют исправимые уязвимости операционной системы из
исходного базового образа.
Опубликованные GHCR-образы проверяет Trivy.
Отчёты загружаются в GitHub code scanning в формате SARIF.

1. В `.github/docker-release-node-lines.json` добавить или удалить поддерживаемую линейку
   Node.js.
2. Если меняется линейка по умолчанию, обновить `default` в
   `.github/docker-release-node-lines.json` и `ARG node_version` в
   `stacks/node/base/Dockerfile`.
3. Вмержить PR с релизными изменениями в `master`.
4. Дождаться прохождения рабочего процесса Docker release.
5. Проверить наличие нового тега в
   [GHCR](https://github.com/orgs/atls/packages/container/package/builder-base).

Рабочий процесс публикует:

1. Неизменяемые теги стека:
   `ghcr.io/atls/stack-node:base-<node-major>-<sha>`,
   `build-<node-major>-<sha>`, `run-<node-major>-<sha>`.
2. Канальные теги стека для каждой поддерживаемой линейки Node.js:
   `ghcr.io/atls/stack-node:base-<node-major>`, `build-<node-major>`,
   `run-<node-major>`.
3. Алиасы без номера линейки: `ghcr.io/atls/stack-node:base`, `build`, `run`.
   Они указывают только на Node.js из `default`.
4. Buildpack-теги с семантической версией: `ghcr.io/atls/buildpack-*:<version>`.
5. Канальные теги группы buildpack для каждой поддерживаемой линейки Node.js:
   `ghcr.io/atls/buildpack-yarn-workspace:<node-major>`.
6. Неизменяемые builder-теги: `ghcr.io/atls/builder-base:<node-major>-<sha>`.
7. Канальные builder-теги: `ghcr.io/atls/builder-base:<node-major>`.
   Они собираются из тегов стека той же линейки Node.js.

Buildpack-теги с семантической версией остаются артефактами для фиксации и отката.
Канальные теги по линейке Node.js подходят потребителям, которым нужен актуальный
проверенный buildpack без обновления патч-версии после каждого релиза.

## Порядок обновления версий CNB buildpack-компонентов

Версии buildpack и extension-компонентов ведутся через `release-please-config.json` и
`.release-please-manifest.json`.
Релизный PR создаёт рабочий процесс GitHub Actions Release PR после слияния в
`master`.
GitHub release и тег создаёт рабочий процесс GitHub release.
Он запускается только после успешного Docker release на том же SHA head-коммита, где
изменился `.release-please-manifest.json`.

Рабочий процесс использует `release-please-action` с правами `contents: write`,
`issues: write` и `pull-requests: write`.
Для создания релизного PR используется токен GitHub App из
`ATLANTIS_SUPER_BOT_APP_ID` и `ATLANTIS_SUPER_BOT_PRIVATE_KEY`.
Так созданные PR запускают обычные проверки `pull_request`.

Buildpack-компоненты связаны через группу `cnb-buildpack-family` в
`release-please` `linked-versions`.
В эту группу входит `libcnb`.
Поэтому изменение общей CNB-библиотеки поднимает версии зависящих
buildpack-компонентов тем же релизным PR.

Составной buildpack `buildpack-yarn-workspace` получает ссылки на связанные
компонентные buildpacks в том же релизном PR.
Для этого используются маркеры `release-please` в
`buildpacks/yarn-workspace/package.toml` и `buildpacks/yarn-workspace/buildpack.toml`.

`jam update-buildpack` для этих файлов не используется.
Он переписывает TOML без сохранения marker-комментариев.
После этого `release-please` перестаёт синхронизировать ссылки составного buildpack.

Extension-компоненты связаны через группу `cnb-extension-family` в `release-please`
`linked-versions`.
`builders/base/builder.toml` получает ссылки на связанные образы расширений в том же
релизном PR.
Docker release берёт публикуемый тег из соответствующего `extension.toml`.

`jam update-builder` сейчас не используется.
`builder-base` остаётся базовым builder: он содержит lifecycle, образы стека и
расширения.
`buildpack-yarn-workspace` выбирает Raijin image pack.

Кроме того, `jam update-builder` ожидает теги build/run-образов с семантической
версией.
`stack-node` публикуется канальными и SHA-тегами вроде `build-24`, `run-24` и
`build-24-<sha>`.

## Запуск Yarn PnP ESM workspace

`buildpack-yarn-workspace-start` формирует слой запуска с `NODE_OPTIONS` для
workspace без `node_modules`.

Если в приложении есть `.pnp.cjs`, buildpack добавляет его через `--require`.
Если в приложении есть `.pnp.loader.mjs`, buildpack добавляет его через `--loader`.
Карты исходников включаются через `--enable-source-maps`.

Прикладной `package.json` не должен дублировать эти флаги в `start`-команде.
Для ESM workspace достаточно запускать собранную точку входа, например
`node dist/index.js`.
