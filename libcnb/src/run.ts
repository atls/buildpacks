import type { Builder }          from './build/interfaces.js'
import type { Detector }         from './detect/interfaces.js'

import { UnsupportedPhaseError } from './errors/index.js'
import { ExitHandler }           from './exit.handler.js'
import { runBuild }              from './build/index.js'
import { runDetect }             from './detect/index.js'
import { isCnbPhase }            from './runtime/index.js'
import { resolveCnbPhase }       from './runtime/index.js'

export const run = async (detector: Detector, builder?: Builder) => {
  const phase = resolveCnbPhase()

  if (!isCnbPhase(phase)) {
    ExitHandler.error(new UnsupportedPhaseError(phase))
  }

  try {
    if (phase === 'detect') {
      await runDetect(detector)
    } else if (phase === 'build') {
      if (builder) {
        await runBuild(builder)
      }
    }
  } catch (error) {
    ExitHandler.error(error)
  }
}
