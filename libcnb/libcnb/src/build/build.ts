import { join }          from 'node:path'

import { Buildpack }     from '../buildpack'
import { Layers }        from '../layers'
import { Store }         from '../output'
import { BuildpackPlan } from '../plan'
import { Platform }      from '../platform'
import { BuildContext }  from './build.context'
import { Builder }       from './builder'

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
