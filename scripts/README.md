# GHCR release contract

Источник workflow управляется из `atls/infrastructure`. В `atls/buildpacks` живут только исходные CNB/Docker-спеки и декларативные входы, которые workflow должен вызывать штатными инструментами.

## Stack images

`docker-bake.hcl` описывает сборку `stack-node` через стандартный Docker Buildx Bake:

- `stack-node-base`
- `stack-node-build`
- `stack-node-run`

Managed workflow передаёт значения через Bake variables:

- `IMAGE_PREFIX`
- `STACK_ID`
- `BASE_IMAGE`
- `NODE_VERSION`
- `RELEASE_TAG`
- `PLATFORMS`

Так stack build-логика остаётся в стандартном `docker/bake-action`, а не в inline shell.

## CNB artifacts

Workflow должен использовать штатные CNB-инструменты:

- `buildpacks/github-actions/setup-pack` для установки `pack`
- `pack extension package` для extensions
- `pack buildpack package` для buildpack и composite buildpack images
- `pack builder create` для builder image
- `docker://ghcr.io/buildpacks/actions/buildpack/compute-metadata` для чтения `buildpack.toml`
- `docker://ghcr.io/buildpacks/actions/buildpackage/verify-metadata` для проверки опубликованного buildpackage metadata

Локальные helpers остаются только там, где нужен наш контракт упаковки TypeScript buildpacks:

- `scripts/prepare-buildpack-package.sh`
- `scripts/verify-buildpack-package.sh`

## Проверки и promotion

Workflow должен использовать готовые actions/commands:

- `aquasecurity/trivy-action` для SARIF и critical fixed vulnerability gate
- `docker buildx imagetools inspect` для проверки multi-arch manifests
- `docker run --platform ... node --version` для runtime Node major check
- `docker buildx imagetools create` для продвижения временных tags в stable/channel tags

## Локальная проверка contract

```bash
docker buildx bake --file docker-bake.hcl --print stack
```

Эта проверка не публикует образы и валидирует только Bake graph.
