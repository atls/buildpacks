import type { BuildContext }         from '@atls/libcnb'
import type { BuildLayer }           from '@atls/libcnb'
import type { LayerEnvironment }     from '@atls/libcnb'

import assert                        from 'node:assert/strict'
import { mkdtemp }                   from 'node:fs/promises'
import { mkdir }                     from 'node:fs/promises'
import { readFile }                  from 'node:fs/promises'
import { rm }                        from 'node:fs/promises'
import { writeFile }                 from 'node:fs/promises'
import { tmpdir }                    from 'node:os'
import { join }                      from 'node:path'
import { test }                      from 'node:test'

import { YarnWorkspaceStartBuilder } from '../src/builder.js'

interface TestLayerEnvironment extends LayerEnvironment {
  toPath: (path: string) => Promise<void>
}

const createTestLayerEnvironment = (): TestLayerEnvironment => {
  const data: Map<string, string> = new Map()

  return {
    append: (name: string, value: string, delim: string = ':'): void => {
      data.set(`${name}.append`, value)
      data.set(`${name}.delim`, delim)
    },

    prepend: (name: string, value: string, delim: string = ':'): void => {
      data.set(`${name}.prepend`, value)
      data.set(`${name}.delim`, delim)
    },

    default: (name: string, value: string): void => {
      data.set(`${name}.default`, value)
    },

    override: (name: string, value: string): void => {
      data.set(`${name}.override`, value)
    },

    toPath: async (path: string): Promise<void> => {
      await mkdir(path, { recursive: true })

      for await (const [key, value] of data.entries()) {
        await writeFile(join(path, key), value)
      }
    },
  }
}

const createTestBuildLayer = (path: string): BuildLayer => {
  const metadata: Map<string, ReturnType<BuildLayer['getMetadata']>> = new Map()
  const sharedEnv = createTestLayerEnvironment()
  const buildEnv = createTestLayerEnvironment()
  const launchEnv = createTestLayerEnvironment()

  return {
    build: false,
    buildEnv,
    cache: false,
    dump: async (): Promise<void> => {
      await mkdir(path, { recursive: true })
      await sharedEnv.toPath(join(path, 'env'))
      await buildEnv.toPath(join(path, 'env.build'))
      await launchEnv.toPath(join(path, 'env.launch'))
    },
    getMetadata: (key: string) => metadata.get(key),
    launch: false,
    launchEnv,
    path,
    setMetadata: (key: string, value: Parameters<BuildLayer['setMetadata']>[1]): void => {
      if (value === null) {
        metadata.delete(key)

        return
      }

      metadata.set(key, value)
    },
    sharedEnv,
  }
}

const writePackageJson = async (
  applicationDir: string,
  scripts: Record<string, string>
): Promise<void> => {
  await writeFile(join(applicationDir, 'package.json'), JSON.stringify({ scripts }, null, 2))
}

const createContext = async (): Promise<{
  applicationDir: string
  context: BuildContext
  outputDir: string
  rootDir: string
  runScriptPath: string
}> => {
  const rootDir = await mkdtemp(join(tmpdir(), 'yarn-workspace-start-'))
  const applicationDir = join(rootDir, 'workspace')
  const layersDir = join(rootDir, 'layers')
  const outputDir = join(rootDir, 'output')

  await mkdir(applicationDir)
  await mkdir(layersDir)
  await mkdir(outputDir)
  await writeFile(
    join(rootDir, 'buildpack.toml'),
    [
      'api = "0.10"',
      '',
      '[buildpack]',
      'id = "tech.atls.buildpacks.yarn-workspace-start"',
      'version = "0.0.0"',
    ].join('\n')
  )

  return {
    applicationDir,
    context: {
      applicationDir,
      buildpack: {
        api: '0.10',
        info: {
          clearEnv: false,
          description: '',
          homepage: '',
          id: 'tech.atls.buildpacks.yarn-workspace-start',
          keywords: [],
          licenses: [],
          name: '',
          version: '0.0.0',
        },
        metadata: {},
        order: [],
        path: rootDir,
        stacks: [],
        targets: [],
      },
      layers: {
        get: async (
          name: string,
          build: boolean = false,
          cache: boolean = false,
          launch: boolean = false
        ) => {
          const layer = createTestBuildLayer(join(layersDir, name))

          layer.build = build
          layer.cache = cache
          layer.launch = launch

          return layer
        },
      },
      store: {
        metadata: {},
      },
      plan: {
        entries: [],
      },
      platform: {
        env: new Map(),
        path: rootDir,
      },
      stackId: 'tech.atls.stacks.node',
    },
    outputDir,
    rootDir,
    runScriptPath: join(rootDir, 'run.sh'),
  }
}

test('YarnWorkspaceStartBuilder uses the packaged Yarn release to run scripts.start-image', async () => {
  const { applicationDir, context, outputDir, rootDir, runScriptPath } = await createContext()

  try {
    await writePackageJson(applicationDir, {
      'start-image': 'astro preview --host 0.0.0.0 --port 3000',
    })
    await mkdir(join(applicationDir, '.yarn'))
    await mkdir(join(applicationDir, '.yarn/releases'))
    await writeFile(join(applicationDir, '.yarnrc.yml'), 'yarnPath: .yarn/releases/yarn.mjs\n')
    await writeFile(join(applicationDir, '.yarn/releases/yarn.mjs'), '')
    await writeFile(join(applicationDir, '.pnp.cjs'), '')
    await writeFile(join(applicationDir, '.pnp.loader.mjs'), '')

    const result = await new YarnWorkspaceStartBuilder(runScriptPath).build(context)
    const runScript = await readFile(runScriptPath, 'utf-8')

    await result.toPath(outputDir)

    assert.equal(
      runScript,
      `#!/usr/bin/env bash\numask 0002\nexec node '${join(applicationDir, '.yarn/releases/yarn.mjs')}' start-image`
    )
    assert.equal(runScript.includes('undefined'), false)
    assert.match(
      await readFile(join(outputDir, 'launch.toml'), 'utf-8'),
      /command = \[ "\.\/run\.sh" \]/
    )
    assert.equal(
      await readFile(join(rootDir, 'layers/node-options/env.launch/NODE_OPTIONS.append'), 'utf-8'),
      `--enable-source-maps --require ${join(applicationDir, '.pnp.cjs')} --loader ${join(applicationDir, '.pnp.loader.mjs')}`
    )
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})

test('YarnWorkspaceStartBuilder falls back to global Yarn when no packaged Yarn release exists', async () => {
  const { applicationDir, context, rootDir, runScriptPath } = await createContext()

  try {
    await writePackageJson(applicationDir, {
      'start-image': 'node server.js',
    })

    await new YarnWorkspaceStartBuilder(runScriptPath).build(context)

    assert.equal(
      await readFile(runScriptPath, 'utf-8'),
      '#!/usr/bin/env bash\numask 0002\nexec yarn start-image'
    )
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})

test('YarnWorkspaceStartBuilder fails when scripts.start-image is missing', async () => {
  const { applicationDir, context, rootDir, runScriptPath } = await createContext()

  try {
    await writePackageJson(applicationDir, {
      start: 'yarn start',
    })

    await assert.rejects(
      new YarnWorkspaceStartBuilder(runScriptPath).build(context),
      /Missing required package\.json script "start-image" for launch command/
    )
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})

test('YarnWorkspaceStartBuilder fails when scripts.start-image is empty', async () => {
  const { applicationDir, context, rootDir, runScriptPath } = await createContext()

  try {
    await writePackageJson(applicationDir, {
      'start-image': '   ',
    })

    await assert.rejects(
      new YarnWorkspaceStartBuilder(runScriptPath).build(context),
      /Missing required package\.json script "start-image" for launch command/
    )
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})
