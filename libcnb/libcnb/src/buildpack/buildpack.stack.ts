export class BuildpackStack {
  constructor(
    public readonly id: string,
    public readonly mixins: Array<string> = []
  ) {}
}
