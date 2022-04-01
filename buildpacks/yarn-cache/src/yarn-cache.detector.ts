import { access }        from 'node:fs/promises'
import { join }          from 'node:path'

import { Detector }      from '@atls/libcnb'
import { DetectContext } from '@atls/libcnb'
import { DetectResult }  from '@atls/libcnb'

export class YarnCacheDetector implements Detector {
  async detect(ctx: DetectContext): Promise<DetectResult> {
    const result = new DetectResult()

    try {
      await access(join(ctx.applicationDir, 'yarn.lock'))
      await access(join(ctx.applicationDir, '.yarn/cache'))
    } catch {
      return result
    }

    result.passed = true

    return result
  }
}
