import { readFile }       from 'node:fs/promises'
import { writeFile }      from 'node:fs/promises'

import { stringify }      from '@iarna/toml'
import { parse }          from '@iarna/toml'

import { BOMEntry }       from './bom-entry'
import { UnmetPlanEntry } from './unmet-plan-entry'

export class BuildMetadata {
  constructor(
    public readonly bom: Array<BOMEntry> = [],
    public readonly unmet: Array<UnmetPlanEntry> = []
  ) {}

  static async fromPath(path) {
    const data: any = parse(await readFile(path, 'utf-8'))

    return new BuildMetadata(
      (data.bom || []).map((bom) => new BOMEntry(bom.name, bom.metadata)),
      (data.unmet || []).map((unmet) => new UnmetPlanEntry(unmet.name))
    )
  }

  async toPath(path) {
    await writeFile(
      path,
      stringify({
        unmet: this.unmet,
        bom: this.bom,
      } as any)
    )
  }
}
