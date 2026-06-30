import type { DetectResult } from './result.js'

export interface DetectContext {
  readonly applicationDir: string
  readonly stackId: string
}

export interface Detector {
  detect: (context: DetectContext) => Promise<DetectResult>
}
