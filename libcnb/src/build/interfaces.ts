import type { BuildpackConfig } from '../config/index.js'
import type { LayerCollection } from '../layers/index.js'
import type { Store }           from '../layers/index.js'
import type { BuildpackPlan }   from '../plan/index.js'
import type { Platform }        from '../platform.js'

import type { BuildResult } from './result.js'

export interface BuildContext {
  readonly applicationDir: string
  readonly buildpack: BuildpackConfig
  readonly layers: LayerCollection
  readonly store: Store
  readonly plan: BuildpackPlan
  readonly platform: Platform
  readonly stackId: string
}

export interface Builder {
  build(context: BuildContext): Promise<BuildResult>
}
