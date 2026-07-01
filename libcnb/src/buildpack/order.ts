import type { BuildpackGroupEntry } from './group-entry.js'

export class BuildpackOrder {
  constructor(public readonly group: Array<BuildpackGroupEntry> = []) {}
}
