import { BuildpackGroupEntry } from './buildpack.group-entry'

export class BuildpackOrder {
  constructor(public readonly group: Array<BuildpackGroupEntry> = []) {}
}
