import type { Builder }      from '@atls/libcnb'
import type { BuildContext } from '@atls/libcnb'

import { BuildResult }       from '@atls/libcnb'
import { Process }           from '@atls/libcnb'
import { Configuration }     from '@yarnpkg/core'
import { Project }           from '@yarnpkg/core'
import { structUtils }       from '@yarnpkg/core'
import { npath }             from '@yarnpkg/fslib'
import execa                 from 'execa'

export class YarnWorkspaceStartBuilder implements Builder {
  async build(ctx: BuildContext): Promise<BuildResult> {
    const applicationDir = npath.toPortablePath(ctx.applicationDir)
    const configuration = await Configuration.find(applicationDir, null, { strict: false })
    const { project } = await Project.find(configuration, applicationDir)
    const workspaceName = ctx.platform.env.get('WORKSPACE')
    const workspace = workspaceName
      ? project.getWorkspaceByIdent(structUtils.parseIdent(workspaceName))
      : project.topLevelWorkspace
    const start = workspace.manifest.scripts.get('start')

    if (!start?.trim()) {
      throw new Error('Missing required package.json script "start" for launch command')
    }

    const yarnPath = configuration.get('yarnPath')

    if (!yarnPath) {
      throw new Error('Missing required yarnPath for the application Yarn runtime')
    }

    const cwd = npath.fromPortablePath(workspace.cwd)
    const runtime = npath.fromPortablePath(yarnPath)
    const options = { cwd, stdio: 'inherit' as const }

    if (workspace.manifest.scripts.has('build')) {
      await execa(process.execPath, [runtime, 'run', 'build'], options)
    }

    await execa(process.execPath, [runtime, 'workspaces', 'focus', '--production'], options)

    const nodeOptionsLayer = await ctx.layers.get('node-options', false, false, true)

    nodeOptionsLayer.launchEnv.append('NODE_OPTIONS', '--enable-source-maps', ' ')

    return new BuildResult()
      .addLaunchProcess(new Process('web', ['node', runtime, 'run', 'start'], [], true, cwd))
      .addLayer(nodeOptionsLayer)
  }
}
