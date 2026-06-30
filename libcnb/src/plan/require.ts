import type { CnbMetadata } from '../metadata/value.interface.js'

export class BuildPlanRequire {
  constructor(
    public readonly name: string,
    public readonly metadata: CnbMetadata = {}
  ) {}
}
