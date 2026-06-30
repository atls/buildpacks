import type { DetectContext } from './context.interface.js'
import type { DetectResult }  from './result.js'

export interface Detector {
  detect: (context: DetectContext) => Promise<DetectResult>
}
