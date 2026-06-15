/// <reference types="jest" />

import { mkdtemp }                    from 'node:fs/promises'
import { mkdir }                      from 'node:fs/promises'
import { readFile }                   from 'node:fs/promises'
import { rm }                         from 'node:fs/promises'
import { writeFile }                  from 'node:fs/promises'
import { tmpdir }                     from 'node:os'
import { join }                       from 'node:path'

import { BuildContext }               from '@atls/libcnb'
import { Layers }                     from '@atls/libcnb'

import { YarnWorkspaceStartBuilder }  from './yarn-workspace-start.builder'

const writePackageJson = async (
  applicationDir: string,
  scripts: Record<string, string>
): Promise<void> => {
  await writeFile(
    join(applicationDir, 'package.json'),
    JSON.stringify({ scripts }, null, 2)
  )
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

  return {
    applicationDir,
    context: {
      applicationDir,
      layers: new Layers(layersDir),
    } as BuildContext,
    outputDir,
    rootDir,
    runScriptPath: join(rootDir, 'run.sh'),
  }
}

describe('YarnWorkspaceStartBuilder', () => {
  it('uses the packaged Yarn release to run scripts.start-image', async () => {
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

      expect(runScript).toBe(
        `#!/usr/bin/env bash\numask 0002\nexec node '${join(applicationDir, '.yarn/releases/yarn.mjs')}' start-image`
      )
      expect(runScript).not.toContain('undefined')
      expect(result.launchMetadata.processes[0].command).toEqual(['./run.sh'])
      expect(result.layers).toHaveLength(1)
      await expect(readFile(join(rootDir, 'layers/node-options/env.launch/NODE_OPTIONS.append'), 'utf-8'))
        .resolves
        .toBe(`--enable-source-maps --require ${join(applicationDir, '.pnp.cjs')} --loader ${join(applicationDir, '.pnp.loader.mjs')}`)
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('falls back to global Yarn when no packaged Yarn release exists', async () => {
    const { applicationDir, context, rootDir, runScriptPath } = await createContext()

    try {
      await writePackageJson(applicationDir, {
        'start-image': 'node server.js',
      })

      await new YarnWorkspaceStartBuilder(runScriptPath).build(context)

      await expect(readFile(runScriptPath, 'utf-8'))
        .resolves
        .toBe('#!/usr/bin/env bash\numask 0002\nexec yarn start-image')
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('fails when scripts.start-image is missing', async () => {
    const { applicationDir, context, rootDir, runScriptPath } = await createContext()

    try {
      await writePackageJson(applicationDir, {
        start: 'yarn start',
      })

      await expect(new YarnWorkspaceStartBuilder(runScriptPath).build(context))
        .rejects
        .toThrow('Missing required package.json script "start-image" for launch command')
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })

  it('fails when scripts.start-image is empty', async () => {
    const { applicationDir, context, rootDir, runScriptPath } = await createContext()

    try {
      await writePackageJson(applicationDir, {
        'start-image': '   ',
      })

      await expect(new YarnWorkspaceStartBuilder(runScriptPath).build(context))
        .rejects
        .toThrow('Missing required package.json script "start-image" for launch command')
    } finally {
      await rm(rootDir, { recursive: true, force: true })
    }
  })
})
