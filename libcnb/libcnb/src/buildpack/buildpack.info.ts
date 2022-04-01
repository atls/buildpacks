import { BuildpackLicense } from './buildpack.license'

export class BuildpackInfo {
  constructor(
    public readonly id: string,
    public readonly version: string,
    public readonly name: string = '',
    public readonly homepage: string = '',
    public readonly clearEnv: boolean = false,
    public readonly description: string = '',
    public readonly keywords: Array<string> = [],
    public readonly licenses: Array<BuildpackLicense> = []
  ) {}
}
