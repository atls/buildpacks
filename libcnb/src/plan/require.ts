import type { Metadata } from '../lifecycle/interfaces.js'

export class BuildPlanRequire {
  constructor(
    public readonly name: string,
    public readonly metadata: Metadata = {}
  ) {}
}
