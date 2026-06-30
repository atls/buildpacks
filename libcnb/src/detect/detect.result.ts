import type { BuildPlan } from '../plan/index.js'

export class DetectResult {
  constructor(
    public passed: boolean = false,
    public readonly plans: Array<BuildPlan> = []
  ) {}
}
