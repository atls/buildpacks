import type { Detector }       from './detector.interface.js'

import { resolveCnbEnvironment } from '../runtime/index.js'
import { resolveDetectArguments } from '../runtime/index.js'
import { ExitHandler }         from '../exit.handler.js'
import { writeTomlFile }     from '../toml/index.js'
import type { DetectContext }  from './context.interface.js'

export const detect = async (detector: Detector) => {
  const { stackId } = resolveCnbEnvironment()
  const { planPath } = resolveDetectArguments()

  const context: DetectContext = {
    applicationDir: process.cwd(),
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
