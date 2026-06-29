/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
import { readFile }  from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'

import { stringify } from '@iarna/toml'
import { parse }     from '@iarna/toml'

import { BOMEntry }  from './bom-entry.js'
import { Label }     from './label.js'
import { Process }   from './process.js'
import { Slice }     from './slice.js'

export class LaunchMetadata {
  constructor(
    public readonly labels: Array<Label> = [],
    public readonly processes: Array<Process> = [],
    public readonly slices: Array<Slice> = [],
    public readonly bom: Array<BOMEntry> = []
  ) {}

  static async fromPath(path: string) {
    const data: any = parse(await readFile(path, 'utf-8'))

    return new LaunchMetadata(
      (data.labels || []).map((label: any) => new Label(label.key, label.value)),
      (data.processes || []).map(
        (process: any) => new Process(process.type, process.command, process.args)
      ),
      (data.slices || []).map((slice: any) => new Slice(slice.path)),
      (data.bom || []).map((bom: any) => new BOMEntry(bom.name, bom.metadata))
    )
  }

  async toPath(path: string) {
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
