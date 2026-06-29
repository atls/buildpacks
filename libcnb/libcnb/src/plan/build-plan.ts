import type { BuildPlanProvide } from './build-plan.provide.js'
import type { BuildPlanRequire } from './build-plan.require.js'

export class BuildPlan {
  constructor(
    public readonly provides: Array<BuildPlanProvide> = [],
    public readonly requires: Array<BuildPlanRequire> = []
  ) {}
}
