# ATLS Buildpacks

Buildpacks, builders and stack images for Node.js applications that use Yarn
workspaces.

The images are published in GitHub Container Registry. They are public and can
be used with pack, CI jobs, or any tool that accepts Cloud Native Buildpacks
builder and buildpack images.

## Build An Application

These examples assume a Yarn project with a checked runtime selected by
`yarnPath` and a production `start` script in package.json.

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

## Select An Application Workspace

Pass the project root and the exact workspace name when building an application
inside a monorepo:

```bash
pack build my-app \
  --path . \
  --builder ghcr.io/atls/builder-base:24 \
  --buildpack ghcr.io/atls/buildpack-yarn-workspace:24 \
  --env WORKSPACE=@example/app
```

`WORKSPACE` selects an application in this buildpack; it is not a Yarn or CNB
standard variable. The selected workspace supplies a production `start` script.
Yarn runs its `build` script when present, focuses production dependencies, and
launches `start`. The root package does not need either script. Yarn retains ownership of workspace
dependencies, patches and Plug'n'Play state; the buildpack does not create a
standalone package or rewrite dependency resolutions.

The buildpack installs dependencies even when the source project
uses a global cache outside its directory. A CNB cache layer supplies the Yarn
global-folder location for build and launch without rewriting `.yarnrc.yml`.
An environment override of `YARN_GLOBAL_FOLDER` pointing elsewhere is rejected
before installation. With global caching disabled, Yarn's effective `cacheFolder`
must stay inside the application or that layer; external paths are rejected
before installation as well.

The project remains the application context. Production focus does not remove
unrelated source files or guarantee a minimal image. Without `WORKSPACE`, the
same build, production focus and launch sequence applies to the root workspace.

## Images

| Image                                 | Use it for                                            |
| ------------------------------------- | ----------------------------------------------------- |
| ghcr.io/atls/builder-base             | Building application images with the ATLS Node stack. |
| ghcr.io/atls/buildpack-yarn-workspace | Building Yarn workspace applications.                 |
| ghcr.io/atls/stack-node               | Stack base, build and run images used by the builder. |

All release images are published for linux/amd64 and linux/arm64.

## Tags

Use Node-line tags for normal application builds:

- ghcr.io/atls/builder-base:26
- ghcr.io/atls/buildpack-yarn-workspace:26

Available Node lines:

- Node 24
- Node 26

Node-line tags move to the latest published image for that Node line. Use them
when an application should receive the current validated builder and buildpack
for its Node version.

Use semantic version tags when a rollout needs a fixed buildpack version:

- ghcr.io/atls/buildpack-yarn-workspace:0.2.2

Stack images use role-specific tags:

- ghcr.io/atls/stack-node:base-26
- ghcr.io/atls/stack-node:build-26
- ghcr.io/atls/stack-node:run-26

The same tags exist for Node 24. Tags without a Node suffix currently point to
the default Node line, which is Node 26:

- ghcr.io/atls/stack-node:base
- ghcr.io/atls/stack-node:build
- ghcr.io/atls/stack-node:run

For application configuration, prefer explicit Node-line tags such as
builder-base:26 and buildpack-yarn-workspace:26.

## Releases

The repository uses one semantic-release version for buildpack components,
extensions and their composite. Conventional Commits select the next version;
release PRs and committed version-bump records are not used. Existing
`buildpack-root-<version>` tags provide the release history, including releases
created before this transition. Existing component tags remain historical.

The GHCR workflow first asks semantic-release for a dry-run version. It uses that
version for component tags and `<node-major>-<version>` builder/stack
tags, builds both supported architectures, and runs the existing manifest,
security and runtime checks. Only then does semantic-release create the GitHub
release. The Node 24/26 channels are promoted after that release succeeds.

CNB TOML files are packaging templates. The existing packaging step substitutes
the supplied `RELEASE_VERSION` with `envsubst`; it does not calculate a version,
rewrite dependency resolutions or commit generated metadata. For a local package,
provide an explicit test version to `scripts/prepare-buildpack-package.sh` and
pass the generated package config to `pack buildpack package`. Builder templates
also require `IMAGE_PREFIX` and `RELEASE_TAG` when rendered.

A failed publication may leave immutable artifacts behind. There is no custom
retry engine or promise of an atomic cross-provider release. A green version
preview alone is not a completed release.

## Yarn Workspace Buildpack

buildpack-yarn-workspace is the application buildpack for Yarn Plug'n'Play
workspace projects, with either provided local caches or a global cache.

The application supplies its production launch command as `scripts.start` in
package.json.

Yarn configures Plug'n'Play for the application process. The buildpack registers
a direct CNB process running the checked Yarn runtime through Node, without a
generated shell launcher, and enables Node source maps. The application launch
script can stay simple:

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

The image start buildpack runs yarn run start. That script should start the
application entrypoint. Do not duplicate Yarn's Plug'n'Play loader flags in it.
The runtime is executed directly, so an ESM Yarn bundle with top-level await does
not need a CommonJS compatibility wrapper or a globally installed Yarn.

## Builder And Buildpack

builder-base is a base builder. It does not make every application buildable by
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

- buildpack-yarn-install
- buildpack-yarn-cache
- buildpack-yarn-workspace-start
- buildpack-require-extension
- buildpack-extension-curl
- buildpack-extension-htop
- buildpack-extension-graphql-hive
