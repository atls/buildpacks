import { join }          from 'node:path'

import { Buildpack }     from '../buildpack/index.js'
import { Layers }        from '../layers/index.js'
import { Store }         from '../output/index.js'
import { BuildpackPlan } from '../plan/index.js'
import { Platform }      from '../platform.js'
import { BuildContext }  from './build.context.js'
import { Builder }       from './builder.js'

export const build = async (builder: Builder) => {
  if (!process.env.CNB_STACK_ID) {
    throw new Error('CNB_STACK_ID is not set')
  }

  if (!process.env.CNB_BUILDPACK_DIR) {
    throw new Error('CNB_BUILDPACK_DIR is not set')
  }

  const stackId = process.env.CNB_STACK_ID
  const buildpackDir = process.env.CNB_BUILDPACK_DIR

  const context = new BuildContext(
    process.cwd(),
    await Buildpack.fromPath(buildpackDir),
    new Layers(process.argv[2]),
    await Store.fromPath(join(process.argv[2], 'store.toml')),
    await BuildpackPlan.fromPath(process.argv[4]),
    await Platform.fromPath(process.argv[3]),
    stackId
  )

  const result = await builder.build(context)

  await result.toPath(process.argv[2])
}
