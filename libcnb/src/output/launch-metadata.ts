import { BOMEntry }  from './bom-entry.js'
import { Label }     from './label.js'
import { Process }   from './process.js'
import { Slice }     from './slice.js'
import { getMetadata } from '../raw/index.js'
import { getOptionalBoolean } from '../raw/index.js'
import { getRecordArray } from '../raw/index.js'
import { getRequiredString } from '../raw/index.js'
import { getStringArray } from '../raw/index.js'
import { getStringTuple } from '../raw/index.js'
import { readTomlRecord } from '../raw/index.js'
import { writeTomlRecord } from '../raw/index.js'

export class LaunchMetadata {
  constructor(
    public readonly labels: Array<Label> = [],
    public readonly processes: Array<Process> = [],
    public readonly slices: Array<Slice> = [],
    public readonly bom: Array<BOMEntry> = []
  ) {}

  static async fromPath(path: string) {
    const data = await readTomlRecord(path)

    return new LaunchMetadata(
      getRecordArray(data, 'labels', 'launch.toml').map(
        (label) =>
          new Label(
            getRequiredString(label, 'key', 'launch.toml.labels'),
            getRequiredString(label, 'value', 'launch.toml.labels')
          )
      ),
      getRecordArray(data, 'processes', 'launch.toml').map(
        (process) =>
          new Process(
            getRequiredString(process, 'type', 'launch.toml.processes'),
            getStringTuple(process, 'command', 'launch.toml.processes'),
            getStringArray(process, 'args', 'launch.toml.processes'),
            getOptionalBoolean(process, 'default', 'launch.toml.processes')
          )
      ),
      getRecordArray(data, 'slices', 'launch.toml').map(
        (slice) => new Slice(getStringTuple(slice, 'paths', 'launch.toml.slices'))
      ),
      getRecordArray(data, 'bom', 'launch.toml').map(
        (bom) =>
          new BOMEntry(
            getRequiredString(bom, 'name', 'launch.toml.bom'),
            getMetadata(bom, 'metadata', 'launch.toml.bom')
          )
      )
    )
  }

  async toPath(path: string) {
    await writeTomlRecord(path, {
      bom: this.bom.map((bom) => ({
        metadata: bom.metadata,
        name: bom.name,
      })),
      labels: this.labels.map((label) => ({
        key: label.key,
        value: label.value,
      })),
      processes: this.processes.map((process) => ({
        args: process.args,
        command: process.command,
        default: process.default,
        type: process.type,
      })),
      slices: this.slices.map((slice) => ({
        paths: slice.paths,
      })),
    })
  }
}
