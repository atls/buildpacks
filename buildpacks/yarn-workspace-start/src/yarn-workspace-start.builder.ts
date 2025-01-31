import { readFileSync } from 'node:fs'
import { writeFile }    from 'node:fs/promises'
import { chmod }        from 'node:fs/promises'
import { join }         from 'node:path'
import { access }         from 'node:fs/promises'

import { Builder }      from '@atls/libcnb'
import { BuildContext } from '@atls/libcnb'
import { BuildResult }  from '@atls/libcnb'
import { Process }      from '@atls/libcnb'

export class YarnWorkspaceStartBuilder implements Builder {
  async build(ctx: BuildContext): Promise<BuildResult> {
    const pkgjson = JSON.parse(readFileSync(join(ctx.applicationDir, 'package.json'), 'utf-8'))

    const command = pkgjson.scripts.start

    await writeFile('/workspace/run.sh', `#!/usr/bin/env bash\numask 0002\n${command}`)
    await chmod('/workspace/run.sh', '755')

    const nodeOptionsLayer = await ctx.layers.get('node-options', true, true, true)

    const nodeOptions: Array<string> = []

    try {
      await access(join(ctx.applicationDir, '.pnp.cjs'))
      nodeOptions.push('--require', join(ctx.applicationDir, '.pnp.cjs'))
    } catch {}

    try {
      await access(join(ctx.applicationDir, '.pnp.loader.mjs'))
      nodeOptions.push('--import', join(ctx.applicationDir, '.pnp.loader.mjs'))
    } catch {}

    console.debug('NODE_OPTIONS', nodeOptions)

    nodeOptionsLayer.launchEnv.append(
      'NODE_OPTIONS',
      nodeOptions.join(' '),
      ' '
    )

    const result = new BuildResult()

    result.launchMetadata.processes.push(new Process('web', ['./run.sh'], [], true))
    result.layers.push(nodeOptionsLayer)

    return result
  }
}
