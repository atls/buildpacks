import assert                 from 'node:assert/strict'
import { mkdtemp }            from 'node:fs/promises'
import { readFile }           from 'node:fs/promises'
import { rm }                 from 'node:fs/promises'
import { writeFile }          from 'node:fs/promises'
import { tmpdir }             from 'node:os'
import { join }               from 'node:path'
import { test }               from 'node:test'

import { BuildpackConfig }    from '../src/config/buildpack.js'
import { Layer }              from '../src/layers/entry.js'
import { Store }              from '../src/layers/store.js'
import { BOMEntry }           from '../src/lifecycle/bom.js'
import { BuildFile }          from '../src/lifecycle/build.js'
import { Label }              from '../src/lifecycle/label.js'
import { LaunchFile }         from '../src/lifecycle/launch.js'
import { Process }            from '../src/lifecycle/process.js'
import { Slice }              from '../src/lifecycle/slice.js'
import { UnmetPlanEntry }     from '../src/lifecycle/unmet.js'
import { BuildpackPlan }      from '../src/plan/buildpack-plan.js'

const createTempDir = async (): Promise<string> => mkdtemp(join(tmpdir(), 'libcnb-'))

test('BuildpackConfig parses buildpack.toml into the normalized config shape', async () => {
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

    const buildpack = await BuildpackConfig.fromPath(rootDir)

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

test('LaunchFile and BuildFile roundtrip through CNB lifecycle files', async () => {
  const rootDir = await createTempDir()
  const launchPath = join(rootDir, 'launch.toml')
  const buildPath = join(rootDir, 'build.toml')

  try {
    const launchFile = new LaunchFile(
      [new Label('io.buildpacks.stack.id', 'tech.atls.stacks.node')],
      [new Process('web', ['node', 'server.js'], ['--port', '3000'], true)],
      [new Slice(['dist'])],
      [new BOMEntry('node', { version: '26' })]
    )
    const buildFile = new BuildFile(
      [new BOMEntry('yarn', { version: '4.14.1' })],
      [new UnmetPlanEntry('node')]
    )

    await launchFile.toPath(launchPath)
    await buildFile.toPath(buildPath)

    assert.deepEqual(await LaunchFile.fromPath(launchPath), launchFile)
    assert.deepEqual(await BuildFile.fromPath(buildPath), buildFile)
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

    assert.equal(layer.name, 'node-options')

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
