import type { BuildpackConfig } from '../config/index.js'
import type { Platform }        from '../platform.js'
import type { DetectResult } from './result.js'

export interface DetectContext {
  readonly applicationDir: string
  readonly buildpack: BuildpackConfig
  readonly platform: Platform
  readonly stackId: string
}

export interface Detector {
  detect: (context: DetectContext) => Promise<DetectResult>
}
