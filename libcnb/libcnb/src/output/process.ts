/**
 * @link https://buildpacks.io/docs/for-buildpack-authors/how-to/write-buildpacks/specify-launch-processes/
 */
export class Process {
  public readonly default: boolean = false

  constructor(
    public readonly type: 'web' | 'worker',
    public readonly command: Array<string>,
    public readonly args: Array<string>,
    default_: boolean = false
  ) {
    this.default = default_
  }
}
