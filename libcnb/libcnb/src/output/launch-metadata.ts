import { readFile }  from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'

import { stringify } from '@iarna/toml'
import { parse }     from '@iarna/toml'

import { BOMEntry }  from './bom-entry'
import { Label }     from './label'
import { Process }   from './process'
import { Slice }     from './slice'

export class LaunchMetadata {
  constructor(
    public readonly labels: Array<Label> = [],
    public readonly processes: Array<Process> = [],
    public readonly slices: Array<Slice> = [],
    public readonly bom: Array<BOMEntry> = []
  ) {}

  static async fromPath(path) {
    const data: any = parse(await readFile(path, 'utf-8'))

    return new LaunchMetadata(
      (data.labels || []).map((label) => new Label(label.key, label.value)),
      (data.processes || []).map(
        (processe) => new Process(processe.type, processe.command, processe.args, processe.direct)
      ),
      (data.slices || []).map((slice) => new Slice(slice.path)),
      (data.bom || []).map((bom) => new BOMEntry(bom.name, bom.metadata))
    )
  }

  async toPath(path) {
    await writeFile(
      path,
      stringify({
        labels: this.labels,
        processes: this.processes,
        slices: this.slices,
        bom: this.bom,
      } as any)
    )
  }
}
