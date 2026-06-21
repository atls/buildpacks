# ATLS Buildpacks

Buildpacks, builders and stack images for Node.js applications that use Yarn
workspaces.

The images are published in GitHub Container Registry. They are public and can
be used with `pack`, CI jobs, or any tool that accepts Cloud Native Buildpacks
builder and buildpack images.

## Build An Application

Use Node 26 for new applications:

```bash
pack build my-app \
  --builder ghcr.io/atls/builder-base:26 \
  --buildpack ghcr.io/atls/buildpack-yarn-workspace:26
```

Use Node 24 when the application must stay on Node 24:

```bash
pack build my-app \
  --builder ghcr.io/atls/builder-base:24 \
  --buildpack ghcr.io/atls/buildpack-yarn-workspace:24
```

The builder provides the Node stack and CNB lifecycle. The buildpack prepares a
Yarn workspace application for build and launch.

## Images

| Image | Use it for |
| --- | --- |
| `ghcr.io/atls/builder-base` | Building application images with the ATLS Node stack. |
| `ghcr.io/atls/buildpack-yarn-workspace` | Building Yarn workspace applications. |
| `ghcr.io/atls/stack-node` | Stack base, build and run images used by the builder. |

All release images are published for `linux/amd64` and `linux/arm64`.

## Tags

Use Node-line tags for normal application builds:

```text
ghcr.io/atls/builder-base:26
ghcr.io/atls/buildpack-yarn-workspace:26
```

Available Node lines:

- Node 24
- Node 26

Node-line tags move to the latest published image for that Node line. Use them
when an application should receive the current validated builder and buildpack
for its Node version.

Use semantic version tags when a rollout needs a fixed buildpack version:

- `ghcr.io/atls/buildpack-yarn-workspace:0.2.2`

Stack images use role-specific tags:

- `ghcr.io/atls/stack-node:base-26`
- `ghcr.io/atls/stack-node:build-26`
- `ghcr.io/atls/stack-node:run-26`

The same tags exist for Node 24. Tags without a Node suffix currently point to
the default Node line, which is Node 26:

- `ghcr.io/atls/stack-node:base`
- `ghcr.io/atls/stack-node:build`
- `ghcr.io/atls/stack-node:run`

For application configuration, prefer explicit Node-line tags such as
`builder-base:26` and `buildpack-yarn-workspace:26`.

## Yarn Workspace Buildpack

`buildpack-yarn-workspace` is the application buildpack for Yarn workspace
projects. It combines install, cache and launch behavior into one buildpack
image.

For Yarn Plug'n'Play applications, the buildpack prepares launch-time Node
options:

- loads `.pnp.cjs` with `--require`;
- loads `.pnp.loader.mjs` with `--loader`;
- enables source maps.

Because the buildpack owns these launch options, the application start command
can stay simple:

```json
{
  "scripts": {
    "start": "node dist/index.js"
  }
}
```

Do not duplicate Plug'n'Play loader flags in the application start script unless
the application intentionally overrides the buildpack behavior.

## Builder And Buildpack

`builder-base` is a base builder. It does not make every application buildable by
itself.

For Yarn workspace applications, pass both images:

```bash
pack build my-app \
  --builder ghcr.io/atls/builder-base:26 \
  --buildpack ghcr.io/atls/buildpack-yarn-workspace:26
```

Tools that wrap CNB builds should use the same pair: one builder image and one
application buildpack image for the selected Node line.

## Registry

- [builder-base](https://github.com/orgs/atls/packages/container/package/builder-base)
- [buildpack-yarn-workspace](https://github.com/orgs/atls/packages/container/package/buildpack-yarn-workspace)
- [stack-node](https://github.com/orgs/atls/packages/container/package/stack-node)

Component buildpacks and extensions are also published in GHCR:

- `buildpack-yarn-install`
- `buildpack-yarn-cache`
- `buildpack-yarn-workspace-start`
- `buildpack-require-extension`
- `buildpack-extension-curl`
- `buildpack-extension-htop`
- `buildpack-extension-graphql-hive`
