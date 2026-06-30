import { Buildpack }     from '../buildpack/index.js'
import { Layers }        from '../layers/index.js'
import { Store }         from '../layers/index.js'
import { BuildpackPlan } from '../plan/index.js'
import { Platform }      from '../platform.js'

export class BuildContext {
  constructor(
    public readonly applicationDir: string,
    public readonly buildpack: Buildpack,
    public readonly layers: Layers,
    public readonly store: Store,
    public readonly plan: BuildpackPlan,
    public readonly platform: Platform,
    public readonly stackId: string
  ) {}
}
