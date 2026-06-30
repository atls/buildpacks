import { resolveBuildArguments } from '../runtime/index.js'
import { resolveCnbEnvironment } from '../runtime/index.js'
import { Layers }        from '../layers/index.js'
import type { BuildContext } from './interfaces.js'
import type { Builder }      from './interfaces.js'

export const runBuild = async (builder: Builder) => {
  const { stackId } = resolveCnbEnvironment()
  const { layersDir } = resolveBuildArguments()

  const context: BuildContext = {
    applicationDir: process.cwd(),
    layers: new Layers(layersDir),
    stackId,
  }

  const result = await builder.build(context)

  await result.toPath(layersDir)
}
