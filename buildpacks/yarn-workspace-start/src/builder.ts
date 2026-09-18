import type { Builder }      from '@atls/libcnb'
import type { BuildContext } from '@atls/libcnb'

/* eslint-disable n/no-sync */
import { readFileSync }      from 'node:fs'
import { writeFile }         from 'node:fs/promises'
import { chmod }             from 'node:fs/promises'
import { access }            from 'node:fs/promises'
import { join }              from 'node:path'
import { isAbsolute }        from 'node:path'

import { BuildResult }       from '@atls/libcnb'
import { Process }           from '@atls/libcnb'
import { Configuration }     from '@yarnpkg/core'
import { Project }           from '@yarnpkg/core'
import { structUtils }       from '@yarnpkg/core'
import { npath }             from '@yarnpkg/fslib'
import execa                 from 'execa'

const RUN_SCRIPT_PATH = '/workspace/run.sh'
const START_IMAGE_SCRIPT = 'start-image'
const PNP_CJS = '.pnp.cjs'
const PNP_ESM_LOADER = '.pnp.loader.mjs'
const YARN_RC = '.yarnrc.yml'

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path)

    return true
  } catch {
    return false
  }
}

const shellQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`

const parseYarnPath = (content: string): string | undefined => {
  const match = content.match(/^\s*yarnPath:\s*(.+?)\s*$/m)

  return match?.[1]?.replace(/^['"]|['"]$/g, '')
}

const resolveYarnPath = async (applicationDir: string): Promise<string | undefined> => {
  const yarnRcPath = join(applicationDir, YARN_RC)

  if (!(await fileExists(yarnRcPath))) {
    return undefined
  }

  const yarnPath = parseYarnPath(readFileSync(yarnRcPath, 'utf-8'))

  if (!yarnPath) {
    return undefined
  }

  const resolvedPath = isAbsolute(yarnPath) ? yarnPath : join(applicationDir, yarnPath)

  if (!(await fileExists(resolvedPath))) {
    return undefined
  }

  return resolvedPath
}

const resolveLaunchCommand = async (
  applicationDir: string,
  workspace?: string
): Promise<string> => {
  const yarnPath = await resolveYarnPath(applicationDir)
  const command = workspace
    ? `workspace ${shellQuote(workspace)} run ${START_IMAGE_SCRIPT}`
    : START_IMAGE_SCRIPT

  if (yarnPath) {
    return `exec node ${shellQuote(yarnPath)} ${command}`
  }

  return `exec yarn ${command}`
}

export class YarnWorkspaceStartBuilder implements Builder {
  constructor(private readonly runScriptPath: string = RUN_SCRIPT_PATH) {}

  async build(ctx: BuildContext): Promise<BuildResult> {
    const workspace = ctx.platform.env.get('BP_YARN_WORKSPACE')
    const pkgjson = JSON.parse(readFileSync(join(ctx.applicationDir, 'package.json'), 'utf-8'))

    let command = pkgjson.scripts?.[START_IMAGE_SCRIPT]

    if (workspace) {
      const applicationDir = npath.toPortablePath(ctx.applicationDir)
      const configuration = await Configuration.find(applicationDir, null, { strict: false })
      const { project } = await Project.find(configuration, applicationDir)

      command = project
        .getWorkspaceByIdent(structUtils.parseIdent(workspace))
        .manifest.scripts.get(START_IMAGE_SCRIPT)
    }

    if (typeof command !== 'string' || command.trim().length === 0) {
      throw new Error(
        `Missing required package.json script "${START_IMAGE_SCRIPT}" for launch command`
      )
    }

    if (workspace) {
      const yarnPath = await resolveYarnPath(ctx.applicationDir)
      const executable = yarnPath ? process.execPath : 'yarn'
      const args = yarnPath ? [yarnPath] : []
      const options = { cwd: ctx.applicationDir, stdio: 'inherit' as const }

      await execa(executable, [...args, 'workspace', workspace, 'run', 'build'], options)
      await execa(executable, [...args, 'workspaces', 'focus', workspace, '--production'], options)
    }

    await writeFile(
      this.runScriptPath,
      `#!/usr/bin/env bash\numask 0002\n${await resolveLaunchCommand(ctx.applicationDir, workspace)}`
    )
    await chmod(this.runScriptPath, '755')

    const nodeOptionsLayer = await ctx.layers.get('node-options', true, true, true)

    const nodeOptions: Array<string> = ['--enable-source-maps']

    if (await fileExists(join(ctx.applicationDir, PNP_CJS))) {
      nodeOptions.push('--require', join(ctx.applicationDir, PNP_CJS))
    }

    if (await fileExists(join(ctx.applicationDir, PNP_ESM_LOADER))) {
      nodeOptions.push('--loader', join(ctx.applicationDir, PNP_ESM_LOADER))
    }

    nodeOptionsLayer.launchEnv.append('NODE_OPTIONS', nodeOptions.join(' '), ' ')

    const result = new BuildResult()

    result.addLaunchProcess(new Process('web', ['./run.sh'], [], true))
    result.addLayer(nodeOptionsLayer)

    return result
  }
}
