import type { Detector }       from './detector.js'

import { Buildpack }           from '../buildpack/index.js'
import { resolveCnbEnvironment } from '../execution/index.js'
import { resolveDetectArguments } from '../execution/index.js'
import { ExitHandler }         from '../exit.handler.js'
import { Platform }            from '../platform.js'
import { writeTomlRecord }     from '../raw/index.js'
import { DetectContext }       from './detect.context.js'

export const detect = async (detector: Detector) => {
  const { buildpackDir, stackId } = resolveCnbEnvironment()
  const { platformDir, planPath } = resolveDetectArguments()

  const context = new DetectContext(
    process.cwd(),
    await Buildpack.fromPath(buildpackDir),
    await Platform.fromPath(platformDir),
    stackId
  )

  const result = await detector.detect(context)

  if (!result.passed) {
    ExitHandler.fail()
  }

  if (result.plans.length > 0) {
    await writeTomlRecord(planPath, {
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
