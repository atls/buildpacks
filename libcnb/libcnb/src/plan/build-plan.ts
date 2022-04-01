import { BuildPlanProvide } from './build-plan.provide'
import { BuildPlanRequire } from './build-plan.require'

export class BuildPlan {
  constructor(
    public readonly provides: Array<BuildPlanProvide> = [],
    public readonly requires: Array<BuildPlanRequire> = []
  ) {}
}
