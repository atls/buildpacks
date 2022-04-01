import { Buildpack } from '../buildpack'
import { Platform }  from '../platform'

export class DetectContext {
  constructor(
    public readonly applicationDir: string,
    public readonly buildpack: Buildpack,
    public readonly platform: Platform,
    public readonly stackId: string
  ) {}
}
