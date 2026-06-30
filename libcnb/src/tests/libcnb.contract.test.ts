import assert                 from 'node:assert/strict'
import { mkdtemp }            from 'node:fs/promises'
import { readFile }           from 'node:fs/promises'
import { rm }                 from 'node:fs/promises'
import { writeFile }          from 'node:fs/promises'
import { tmpdir }             from 'node:os'
import { join }               from 'node:path'
import { test }               from 'node:test'

import { BOMEntry }           from '@atls/libcnb'
import { BuildMetadata }      from '@atls/libcnb'
import { Buildpack }          from '@atls/libcnb'
import { BuildpackPlan }      from '@atls/libcnb'
import { Label }              from '@atls/libcnb'
import { LaunchMetadata }     from '@atls/libcnb'
import { Layer }              from '@atls/libcnb'
import { Process }            from '@atls/libcnb'
import { Slice }              from '@atls/libcnb'
import { Store }              from '@atls/libcnb'
import { UnmetPlanEntry }     from '@atls/libcnb'

const createTempDir = async (): Promise<string> => mkdtemp(join(tmpdir(), 'libcnb-'))

test('Buildpack parses buildpack.toml into the public metadata model', async () => {
  const rootDir = await createTempDir()

  try {
    await writeFile(
      join(rootDir, 'buildpack.toml'),
      [
        'api = "0.10"',
        '',
        '[buildpack]',
        'id = "tech.atls.buildpacks.fixture"',
        'version = "1.2.3"',
        'name = "Fixture"',
        'homepage = "https://example.com"',
        'clear-env = true',
        'description = "Fixture buildpack"',
        'keywords = ["node", "yarn"]',
        '',
        '[[buildpack.licenses]]',
        'type = "BSD-3-Clause"',
        'uri = "https://example.com/license"',
        '',
        '[[stacks]]',
        'id = "tech.atls.stacks.node"',
        'mixins = ["ca-certificates"]',
        '',
        '[metadata]',
        'owner = "atls"',
        '',
        '[metadata.flags]',
        'strict = true',
        '',
        '[[order]]',
        '[[order.group]]',
        'id = "tech.atls.buildpacks.yarn-install"',
        'version = "1.0.0"',
        'optional = true',
        '',
      ].join('\n')
    )

    const buildpack = await Buildpack.fromPath(rootDir)

    assert.equal(buildpack.api, '0.10')
    assert.equal(buildpack.info.id, 'tech.atls.buildpacks.fixture')
    assert.equal(buildpack.info.version, '1.2.3')
    assert.equal(buildpack.info.clearEnv, true)
    assert.deepEqual(buildpack.info.keywords, ['node', 'yarn'])
    assert.deepEqual(buildpack.metadata, {
      flags: {
        strict: true,
      },
      owner: 'atls',
    })
    assert.equal(buildpack.stacks[0].id, 'tech.atls.stacks.node')
    assert.deepEqual(buildpack.stacks[0].mixins, ['ca-certificates'])
    assert.equal(buildpack.order[0].group[0].optional, true)
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})

test('BuildpackPlan parses plan.toml entries without leaking TOML payload shape', async () => {
  const rootDir = await createTempDir()
  const planPath = join(rootDir, 'plan.toml')

  try {
    await writeFile(
      planPath,
      [
        '[[entries]]',
        'name = "node"',
        '',
        '[entries.metadata]',
        'version = "26"',
        '',
      ].join('\n')
    )

    const plan = await BuildpackPlan.fromPath(planPath)

    assert.equal(plan.entries[0].name, 'node')
    assert.deepEqual(plan.entries[0].metadata, {
      version: '26',
    })
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})

test('LaunchMetadata and BuildMetadata roundtrip through CNB TOML metadata files', async () => {
  const rootDir = await createTempDir()
  const launchPath = join(rootDir, 'launch.toml')
  const buildPath = join(rootDir, 'build.toml')

  try {
    const launchMetadata = new LaunchMetadata(
      [new Label('io.buildpacks.stack.id', 'tech.atls.stacks.node')],
      [new Process('web', ['node', 'server.js'], ['--port', '3000'], true)],
      [new Slice(['dist'])],
      [new BOMEntry('node', { version: '26' })]
    )
    const buildMetadata = new BuildMetadata(
      [new BOMEntry('yarn', { version: '4.14.1' })],
      [new UnmetPlanEntry('node')]
    )

    await launchMetadata.toPath(launchPath)
    await buildMetadata.toPath(buildPath)

    assert.deepEqual(await LaunchMetadata.fromPath(launchPath), launchMetadata)
    assert.deepEqual(await BuildMetadata.fromPath(buildPath), buildMetadata)
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})

test('Layer and Store persist typed metadata and environment files', async () => {
  const rootDir = await createTempDir()
  const layerPath = join(rootDir, 'layers/node-options')
  const storePath = join(rootDir, 'layers/store.toml')

  try {
    const layer = new Layer(layerPath)

    layer.build = true
    layer.launch = true
    layer.setMetadata('locksum', 'abc123')
    layer.launchEnv.append('NODE_OPTIONS', '--enable-source-maps')

    await layer.dump()
    await new Store({ node: '26' }).toPath(storePath)

    const loadedLayer = new Layer(layerPath)

    await loadedLayer.load()

    assert.equal(loadedLayer.build, true)
    assert.equal(loadedLayer.cache, false)
    assert.equal(loadedLayer.launch, true)
    assert.equal(loadedLayer.getMetadata('locksum'), 'abc123')
    assert.equal(
      await readFile(join(layerPath, 'env.launch/NODE_OPTIONS.append'), 'utf-8'),
      '--enable-source-maps'
    )
    assert.deepEqual(await Store.fromPath(storePath), new Store({ node: '26' }))
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})
