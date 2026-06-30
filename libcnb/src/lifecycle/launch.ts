import { BOMEntry }  from './bom.js'
import { Label }     from './label.js'
import { Process }   from './process.js'
import { Slice }     from './slice.js'
import { readMetadata } from '../toml/index.js'
import { readOptionalBoolean } from '../toml/index.js'
import { readTableArray } from '../toml/index.js'
import { readRequiredString } from '../toml/index.js'
import { readStringArray } from '../toml/index.js'
import { readStringTuple } from '../toml/index.js'
import { readTomlFile } from '../toml/index.js'
import { writeTomlFile } from '../toml/index.js'

export class LaunchFile {
  constructor(
    public readonly labels: Array<Label> = [],
    public readonly processes: Array<Process> = [],
    public readonly slices: Array<Slice> = [],
    public readonly bom: Array<BOMEntry> = []
  ) {}

  static async fromPath(path: string) {
    const data = await readTomlFile(path)

    return new LaunchFile(
      readTableArray(data, 'labels', 'launch.toml').map(
        (label) =>
          new Label(
            readRequiredString(label, 'key', 'launch.toml.labels'),
            readRequiredString(label, 'value', 'launch.toml.labels')
          )
      ),
      readTableArray(data, 'processes', 'launch.toml').map(
        (process) =>
          new Process(
            readRequiredString(process, 'type', 'launch.toml.processes'),
            readStringTuple(process, 'command', 'launch.toml.processes'),
            readStringArray(process, 'args', 'launch.toml.processes'),
            readOptionalBoolean(process, 'default', 'launch.toml.processes')
          )
      ),
      readTableArray(data, 'slices', 'launch.toml').map(
        (slice) => new Slice(readStringTuple(slice, 'paths', 'launch.toml.slices'))
      ),
      readTableArray(data, 'bom', 'launch.toml').map(
        (bom) =>
          new BOMEntry(
            readRequiredString(bom, 'name', 'launch.toml.bom'),
            readMetadata(bom, 'metadata', 'launch.toml.bom')
          )
      )
    )
  }

  async toPath(path: string) {
    await writeTomlFile(path, {
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
