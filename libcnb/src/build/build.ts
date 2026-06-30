import { join }          from 'node:path'

import { Buildpack }     from '../buildpack/index.js'
import { resolveBuildArguments } from '../runtime/index.js'
import { resolveCnbEnvironment } from '../runtime/index.js'
import { Layers }        from '../layers/index.js'
import { Store }         from '../layers/index.js'
import { BuildpackPlan } from '../plan/index.js'
import { Platform }      from '../platform.js'
import { BuildContext }  from './context.js'
import { Builder }       from './builder.js'

export const build = async (builder: Builder) => {
  const { buildpackDir, stackId } = resolveCnbEnvironment()
  const { layersDir, platformDir, planPath } = resolveBuildArguments()

  const context = new BuildContext(
    process.cwd(),
    await Buildpack.fromPath(buildpackDir),
    new Layers(layersDir),
    await Store.fromPath(join(layersDir, 'store.toml')),
    await BuildpackPlan.fromPath(planPath),
    await Platform.fromPath(platformDir),
    stackId
  )

  const result = await builder.build(context)

  await result.toPath(layersDir)
}
