import type { Detector }       from './interfaces.js'

import { BuildpackConfig }     from '../config/index.js'
import { resolveCnbEnvironment } from '../runtime/index.js'
import { resolveDetectArguments } from '../runtime/index.js'
import { ExitHandler }         from '../exit.handler.js'
import { Platform }            from '../platform.js'
import { writeTomlFile }     from '../toml/index.js'
import type { DetectContext }  from './interfaces.js'

export const runDetect = async (detector: Detector) => {
  const { buildpackDir, stackId } = resolveCnbEnvironment()
  const { platformDir, planPath } = resolveDetectArguments()

  const context: DetectContext = {
    applicationDir: process.cwd(),
    buildpack: await BuildpackConfig.fromPath(buildpackDir),
    platform: await Platform.fromPath(platformDir),
    stackId,
  }

  const result = await detector.detect(context)

  if (!result.passed) {
    ExitHandler.fail()
  }

  if (result.plans.length > 0) {
    await writeTomlFile(planPath, {
      provides: result.plans[0].provides.map((provide) => ({
        name: provide.name,
      })),
      requires: result.plans[0].requires.map((require) => ({
        metadata: require.metadata,
        name: require.name,
      })),
    })
  }
}
