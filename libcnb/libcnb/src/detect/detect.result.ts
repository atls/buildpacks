import { BuildPlan } from '../plan'

export class DetectResult {
  constructor(
    public passed: boolean = false,
    public readonly plans: Array<BuildPlan> = []
  ) {}
}
