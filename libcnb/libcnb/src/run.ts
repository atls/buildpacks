import type { Builder }  from './build/index.js'
import type { Detector } from './detect/index.js'

import { basename }      from 'node:path'

import { ExitHandler }   from './exit.handler.js'
import { build }         from './build/index.js'
import { detect }        from './detect/index.js'

export const run = async (detector: Detector, builder?: Builder) => {
  const phase = basename(process.argv[1])

  if (!['detect', 'build'].includes(phase)) {
    ExitHandler.error(new Error(`Unsupported phase ${phase}`))
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
