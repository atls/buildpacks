import type { BuildPlanProvide } from './provide.js'
import type { BuildPlanRequire } from './require.js'

export class BuildPlan {
  constructor(
    public readonly provides: Array<BuildPlanProvide> = [],
    public readonly requires: Array<BuildPlanRequire> = []
  ) {}
}
