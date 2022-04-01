import { Buildpack }     from '../buildpack'
import { Layers }        from '../layers'
import { Store }         from '../output'
import { BuildpackPlan } from '../plan'
import { Platform }      from '../platform'

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
