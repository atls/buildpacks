import type { DetectContext } from './context.js'
import type { DetectResult }  from './result.js'

export interface Detector {
  detect: (context: DetectContext) => Promise<DetectResult>
}
