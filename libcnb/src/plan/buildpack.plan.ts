import { BuildpackPlanEntry } from './buildpack.plan-entry.js'
import { getMetadata }        from '../raw/index.js'
import { getRecordArray }     from '../raw/index.js'
import { getRequiredString }  from '../raw/index.js'
import { readTomlRecord }     from '../raw/index.js'

export class BuildpackPlan {
  constructor(public readonly entries: Array<BuildpackPlanEntry> = []) {}

  static async fromPath(path: string) {
    const data = await readTomlRecord(path)

    return new BuildpackPlan(
      getRecordArray(data, 'entries', 'plan.toml').map(
        (entry) =>
          new BuildpackPlanEntry(
            getRequiredString(entry, 'name', 'plan.toml.entries'),
            getMetadata(entry, 'metadata', 'plan.toml.entries')
          )
      )
    )
  }
}
