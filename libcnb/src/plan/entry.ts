import type { Metadata } from '../lifecycle/interfaces.js'

export class BuildpackPlanEntry {
  constructor(
    public readonly name: string,
    public readonly metadata: Metadata = {}
  ) {}
}
