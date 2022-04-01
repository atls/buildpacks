export class Process {
  public readonly default: boolean = false

  constructor(
    public readonly type: 'web' | 'worker',
    public readonly command: string,
    public readonly args: Array<string>,
    public readonly direct: boolean = false,
    default_: boolean = false
  ) {
    this.default = default_
  }
}
