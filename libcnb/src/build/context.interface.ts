import type { LayerCollection } from '../layers/index.js'

export interface BuildContext {
  readonly applicationDir: string
  readonly layers: LayerCollection
  readonly stackId: string
}
