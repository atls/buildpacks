import { readFileSync } from 'node:fs'
import { writeFile }    from 'node:fs/promises'
import { chmod }        from 'node:fs/promises'
import { join }         from 'node:path'
import { access }         from 'node:fs/promises'

import { Builder }      from '@atls/libcnb'
import { BuildContext } from '@atls/libcnb'
import { BuildResult }  from '@atls/libcnb'
import { Process }      from '@atls/libcnb'

const RUN_SCRIPT_PATH = '/workspace/run.sh'
const PNP_CJS = '.pnp.cjs'
const PNP_ESM_LOADER = '.pnp.loader.mjs'

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path)

    return true
  } catch {
    return false
  }
}

export class YarnWorkspaceStartBuilder implements Builder {
  async build(ctx: BuildContext): Promise<BuildResult> {
    const pkgjson = JSON.parse(readFileSync(join(ctx.applicationDir, 'package.json'), 'utf-8'))

    const command = pkgjson.scripts.start

    await writeFile(RUN_SCRIPT_PATH, `#!/usr/bin/env bash\numask 0002\n${command}`)
    await chmod(RUN_SCRIPT_PATH, '755')

    const nodeOptionsLayer = await ctx.layers.get('node-options', true, true, true)

    const nodeOptions: Array<string> = ['--enable-source-maps']

    if (await fileExists(join(ctx.applicationDir, PNP_CJS))) {
      nodeOptions.push('--require', join(ctx.applicationDir, PNP_CJS))
    }

    if (await fileExists(join(ctx.applicationDir, PNP_ESM_LOADER))) {
      nodeOptions.push('--loader', join(ctx.applicationDir, PNP_ESM_LOADER))
    }

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
