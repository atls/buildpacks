import type { Metadata } from './interfaces.js'

export class BOMEntry {
  constructor(
    public readonly name: string,
    public readonly metadata: Metadata = {}
  ) {}
}
