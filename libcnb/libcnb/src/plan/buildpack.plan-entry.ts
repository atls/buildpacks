/* eslint-disable @typescript-eslint/no-explicit-any */
export class BuildpackPlanEntry {
  constructor(
    public readonly name: string,
    public readonly metadata: Record<string, any>
  ) {}
}
