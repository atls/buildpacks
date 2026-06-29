/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
import { readFile }       from 'node:fs/promises'
import { writeFile }      from 'node:fs/promises'

import { stringify }      from '@iarna/toml'
import { parse }          from '@iarna/toml'

import { BOMEntry }       from './bom-entry.js'
import { UnmetPlanEntry } from './unmet-plan-entry.js'

export class BuildMetadata {
  constructor(
    public readonly bom: Array<BOMEntry> = [],
    public readonly unmet: Array<UnmetPlanEntry> = []
  ) {}

  static async fromPath(path: string) {
    const data: any = parse(await readFile(path, 'utf-8'))

    return new BuildMetadata(
      (data.bom || []).map((bom: any) => new BOMEntry(bom.name, bom.metadata)),
      (data.unmet || []).map((unmet: any) => new UnmetPlanEntry(unmet.name))
    )
  }

  async toPath(path: string) {
    await writeFile(
      path,
      stringify({
        unmet: this.unmet,
        bom: this.bom,
      } as any)
    )
  }
}
