import { BuildpackPlanEntry } from './entry.js'
import { readMetadata }       from '../toml/index.js'
import { readTableArray }     from '../toml/index.js'
import { readRequiredString } from '../toml/index.js'
import { readTomlFile }       from '../toml/index.js'

export class BuildpackPlan {
  constructor(public readonly entries: Array<BuildpackPlanEntry> = []) {}

  static async fromPath(path: string) {
    const data = await readTomlFile(path)

    return new BuildpackPlan(
      readTableArray(data, 'entries', 'plan.toml').map(
        (entry) =>
          new BuildpackPlanEntry(
            readRequiredString(entry, 'name', 'plan.toml.entries'),
            readMetadata(entry, 'metadata', 'plan.toml.entries')
          )
      )
    )
  }
}
