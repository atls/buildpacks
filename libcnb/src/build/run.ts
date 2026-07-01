import { join }                 from 'node:path'

import { resolveBuildArguments } from '../runtime/index.js'
import { resolveCnbEnvironment } from '../runtime/index.js'
import { BuildpackConfig }       from '../config/index.js'
import { Layers }        from '../layers/index.js'
import { Store }         from '../layers/index.js'
import { BuildpackPlan } from '../plan/index.js'
import { Platform }      from '../platform.js'
import type { BuildContext } from './interfaces.js'
import type { Builder }      from './interfaces.js'

export const runBuild = async (builder: Builder) => {
  const { buildpackDir, stackId } = resolveCnbEnvironment()
  const { layersDir, platformDir, planPath } = resolveBuildArguments()

  const context: BuildContext = {
    applicationDir: process.cwd(),
    buildpack: await BuildpackConfig.fromPath(buildpackDir),
    layers: new Layers(layersDir),
    store: await Store.fromPath(join(layersDir, 'store.toml')),
    plan: await BuildpackPlan.fromPath(planPath),
    platform: await Platform.fromPath(platformDir),
    stackId,
  }

  const result = await builder.build(context)

  await result.toPath(layersDir)
}
