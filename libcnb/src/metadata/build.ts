import { BOMEntry }       from './bom.js'
import { UnmetPlanEntry } from './unmet.js'
import { readMetadata }    from '../toml/index.js'
import { readRequiredString } from '../toml/index.js'
import { readTableArray } from '../toml/index.js'
import { readTomlFile } from '../toml/index.js'
import { writeTomlFile } from '../toml/index.js'

export class BuildMetadata {
  constructor(
    public readonly bom: Array<BOMEntry> = [],
    public readonly unmet: Array<UnmetPlanEntry> = []
  ) {}

  static async fromPath(path: string) {
    const data = await readTomlFile(path)

    return new BuildMetadata(
      readTableArray(data, 'bom', 'build.toml').map(
        (bom) =>
          new BOMEntry(
            readRequiredString(bom, 'name', 'build.toml.bom'),
            readMetadata(bom, 'metadata', 'build.toml.bom')
          )
      ),
      readTableArray(data, 'unmet', 'build.toml').map(
        (unmet) => new UnmetPlanEntry(readRequiredString(unmet, 'name', 'build.toml.unmet'))
      )
    )
  }

  async toPath(path: string) {
    await writeTomlFile(path, {
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
