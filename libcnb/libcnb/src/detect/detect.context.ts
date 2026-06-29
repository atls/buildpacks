import type { Buildpack } from '../buildpack/index.js'
import type { Platform }  from '../platform.js'

export class DetectContext {
  constructor(
    public readonly applicationDir: string,
    public readonly buildpack: Buildpack,
    public readonly platform: Platform,
    public readonly stackId: string
  ) {}
}
