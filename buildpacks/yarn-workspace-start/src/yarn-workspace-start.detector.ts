import { Detector }      from '@atls/libcnb'
import { DetectContext } from '@atls/libcnb'
import { DetectResult }  from '@atls/libcnb'

export class YarnWorkspaceStartDetector implements Detector {
  async detect(ctx: DetectContext): Promise<DetectResult> {
    const result = new DetectResult()

    result.passed = true

    return result
  }
}
