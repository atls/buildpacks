import type { LayerCollection } from '../layers/index.js'

import type { BuildResult } from './result.js'

export interface BuildContext {
  readonly applicationDir: string
  readonly layers: LayerCollection
  readonly stackId: string
}

export interface Builder {
  build(context: BuildContext): Promise<BuildResult>
}
