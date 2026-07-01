import type { DetectOutput } from './interfaces.js'

export class DetectResult implements DetectOutput {
  constructor(
    public passed: boolean = false,
    public readonly plans: DetectOutput['plans'] = []
  ) {}
}
