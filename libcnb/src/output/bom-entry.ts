import type { CnbMetadata } from '../metadata.js'

export class BOMEntry {
  constructor(
    public readonly name: string,
    public readonly metadata: CnbMetadata = {}
  ) {}
}
