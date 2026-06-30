import type { CnbMetadata } from '../metadata.js'

export class BuildpackPlanEntry {
  constructor(
    public readonly name: string,
    public readonly metadata: CnbMetadata = {}
  ) {}
}
