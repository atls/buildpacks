import type { Builder }  from './build/builder.interface.js'
import type { Detector } from './detect/detector.interface.js'

import { UnsupportedCnbPhaseError } from './errors/index.js'
import { ExitHandler }   from './exit.handler.js'
import { build }         from './build/index.js'
import { detect }        from './detect/index.js'
import { isCnbPhase }    from './runtime/index.js'
import { resolveCnbPhase } from './runtime/index.js'

export const run = async (detector: Detector, builder?: Builder) => {
  const phase = resolveCnbPhase()

  if (!isCnbPhase(phase)) {
    ExitHandler.error(new UnsupportedCnbPhaseError(phase))
  }

  try {
    if (phase === 'detect') {
      await detect(detector)
    } else if (phase === 'build') {
      if (builder) {
        await build(builder)
      }
    }
  } catch (error) {
    ExitHandler.error(error)
  }
}
