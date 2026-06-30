import { BOMEntry }       from './bom-entry.js'
import { UnmetPlanEntry } from './unmet-plan-entry.js'
import { getMetadata }    from '../raw/index.js'
import { getRecordArray } from '../raw/index.js'
import { getRequiredString } from '../raw/index.js'
import { readTomlRecord } from '../raw/index.js'
import { writeTomlRecord } from '../raw/index.js'

export class BuildMetadata {
  constructor(
    public readonly bom: Array<BOMEntry> = [],
    public readonly unmet: Array<UnmetPlanEntry> = []
  ) {}

  static async fromPath(path: string) {
    const data = await readTomlRecord(path)

    return new BuildMetadata(
      getRecordArray(data, 'bom', 'build.toml').map(
        (bom) =>
          new BOMEntry(
            getRequiredString(bom, 'name', 'build.toml.bom'),
            getMetadata(bom, 'metadata', 'build.toml.bom')
          )
      ),
      getRecordArray(data, 'unmet', 'build.toml').map(
        (unmet) => new UnmetPlanEntry(getRequiredString(unmet, 'name', 'build.toml.unmet'))
      )
    )
  }

  async toPath(path: string) {
    await writeTomlRecord(path, {
      bom: this.bom.map((bom) => ({
        metadata: bom.metadata,
        name: bom.name,
      })),
      unmet: this.unmet.map((unmet) => ({
        name: unmet.name,
      })),
    })
  }
}
