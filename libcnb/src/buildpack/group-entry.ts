export class BuildpackGroupEntry {
  constructor(
    public readonly id: string,
    public readonly version: string,
    public readonly optional: boolean = false
  ) {}
}
