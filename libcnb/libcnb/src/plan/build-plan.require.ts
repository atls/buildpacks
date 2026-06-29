/* eslint-disable @typescript-eslint/no-explicit-any */
export class BuildPlanRequire {
  constructor(
    public readonly name: string,
    public readonly metadata: Record<string, any>
  ) {}
}
