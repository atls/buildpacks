import type { BuildpackGroupEntry } from './buildpack.group-entry.js'

export class BuildpackOrder {
  constructor(public readonly group: Array<BuildpackGroupEntry> = []) {}
}
