import { readFile }           from 'node:fs/promises'

import { parse }              from '@iarna/toml'

import { BuildpackPlanEntry } from './buildpack.plan-entry'

export class BuildpackPlan {
  constructor(public readonly entries: Array<BuildpackPlanEntry> = []) {}

  static async fromPath(path: string) {
    const data: any = parse(await readFile(path, 'utf-8'))

    return new BuildpackPlan(
      (data.entries || []).map((entry) => new BuildpackPlanEntry(entry.name, entry.metadata))
    )
  }
}
