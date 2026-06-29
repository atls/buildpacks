/* eslint-disable @typescript-eslint/no-explicit-any */
export class BOMEntry {
  constructor(
    public readonly name: string,
    public readonly metadata: Record<string, any>
  ) {}
}
