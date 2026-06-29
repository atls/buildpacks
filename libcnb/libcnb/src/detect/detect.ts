import type { Detector } from './detector.js'

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-argument */
import { writeFile }     from 'node:fs/promises'

import { stringify }     from '@iarna/toml'

import { Buildpack }     from '../buildpack/index.js'
import { ExitHandler }   from '../exit.handler.js'
import { Platform }      from '../platform.js'
import { DetectContext } from './detect.context.js'

export const detect = async (detector: Detector) => {
  if (!process.env.CNB_STACK_ID) {
    throw new Error('CNB_STACK_ID is not set')
  }

  if (!process.env.CNB_BUILDPACK_DIR) {
    throw new Error('CNB_BUILDPACK_DIR is not set')
  }

  const stackId = process.env.CNB_STACK_ID
  const buildpackDir = process.env.CNB_BUILDPACK_DIR

  const context = new DetectContext(
    process.cwd(),
    await Buildpack.fromPath(buildpackDir),
    await Platform.fromPath(process.argv[2]),
    stackId
  )

  const result = await detector.detect(context)

  if (!result.passed) {
    ExitHandler.fail()
  }

  if (result.plans && result.plans.length > 0) {
    writeFile(
      process.argv[3],
      stringify({
        provides: result.plans[0].provides,
        requires: result.plans[0].requires,
      } as any)
    )
  }
}
