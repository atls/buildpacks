import type { CnbMetadata } from './value.interface.js'

export class BOMEntry {
  constructor(
    public readonly name: string,
    public readonly metadata: CnbMetadata = {}
  ) {}
}
