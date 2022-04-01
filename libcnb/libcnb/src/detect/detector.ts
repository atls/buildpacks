import { DetectContext } from './detect.context'
import { DetectResult }  from './detect.result'

export interface Detector {
  detect(context: DetectContext): Promise<DetectResult>
}
