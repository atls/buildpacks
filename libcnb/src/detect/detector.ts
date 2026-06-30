import type { DetectContext } from './detect.context.js'
import type { DetectResult }  from './detect.result.js'

export interface Detector {
  detect: (context: DetectContext) => Promise<DetectResult>
}
