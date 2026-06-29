/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
import { readFile }           from 'node:fs/promises'

import { parse }              from '@iarna/toml'

import { BuildpackPlanEntry } from './buildpack.plan-entry.js'

export class BuildpackPlan {
  constructor(public readonly entries: Array<BuildpackPlanEntry> = []) {}

  static async fromPath(path: string) {
    const data: any = parse(await readFile(path, 'utf-8'))

    return new BuildpackPlan(
      (data.entries || []).map((entry: any) => new BuildpackPlanEntry(entry.name, entry.metadata))
    )
  }
}
