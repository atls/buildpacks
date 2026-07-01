/**
 * @link https://buildpacks.io/docs/for-buildpack-authors/how-to/write-buildpacks/specify-launch-processes/
 */
export class Process {
  public readonly default: boolean = false

  constructor(
    public readonly type: string,
    public readonly command: Array<string>,
    public readonly args: Array<string>,
    default_: boolean = false,
    public readonly direct: boolean = false,
    public readonly workingDir: string = '',
    public readonly execEnv: Array<string> = []
  ) {
    this.default = default_
  }
}
