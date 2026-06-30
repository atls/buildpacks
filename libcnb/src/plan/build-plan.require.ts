import type { CnbMetadata } from '../metadata.js'

export class BuildPlanRequire {
  constructor(
    public readonly name: string,
    public readonly metadata: CnbMetadata = {}
  ) {}
}
