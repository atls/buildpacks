import type { CnbMetadata }     from '../metadata.js'
import type { RawRecord }       from '../raw/index.js'

import { BuildpackGroupEntry } from './buildpack.group-entry.js'
import { BuildpackInfo }       from './buildpack.info.js'
import { BuildpackLicense }    from './buildpack.license.js'
import { BuildpackOrder }      from './buildpack.order.js'
import { BuildpackStack }      from './buildpack.stack.js'
import { getMetadata }         from '../raw/index.js'
import { getOptionalBoolean }  from '../raw/index.js'
import { getOptionalString }   from '../raw/index.js'
import { getRecordArray }      from '../raw/index.js'
import { getRequiredRecord }   from '../raw/index.js'
import { getRequiredString }   from '../raw/index.js'
import { getStringArray }      from '../raw/index.js'
import { readTomlRecord }      from '../raw/index.js'

export class Buildpack {
  constructor(
    public readonly api: string,
    public readonly info: BuildpackInfo,
    public readonly path: string,
    public readonly stacks: Array<BuildpackStack> = [],
    public readonly metadata: CnbMetadata = {},
    public readonly order: Array<BuildpackOrder> = []
  ) {}

  static async fromPath(path: string) {
    const data = await readTomlRecord(`${path}/buildpack.toml`)

    return Buildpack.fromRaw(data, path)
  }

  static fromRaw(data: RawRecord, path: string) {
    const buildpack = getRequiredRecord(data, 'buildpack', 'buildpack.toml')

    return new Buildpack(
      getRequiredString(data, 'api', 'buildpack.toml'),
      new BuildpackInfo(
        getRequiredString(buildpack, 'id', 'buildpack.toml.buildpack'),
        getRequiredString(buildpack, 'version', 'buildpack.toml.buildpack'),
        getOptionalString(buildpack, 'name', 'buildpack.toml.buildpack'),
        getOptionalString(buildpack, 'homepage', 'buildpack.toml.buildpack'),
        getOptionalBoolean(buildpack, 'clear-env', 'buildpack.toml.buildpack'),
        getOptionalString(buildpack, 'description', 'buildpack.toml.buildpack'),
        getStringArray(buildpack, 'keywords', 'buildpack.toml.buildpack'),
        getRecordArray(buildpack, 'licenses', 'buildpack.toml.buildpack').map(
          (license) =>
            new BuildpackLicense(
              getOptionalString(license, 'type', 'buildpack.toml.buildpack.licenses'),
              getOptionalString(license, 'uri', 'buildpack.toml.buildpack.licenses')
            )
        )
      ),
      path,
      getRecordArray(data, 'stacks', 'buildpack.toml').map(
        (stack) =>
          new BuildpackStack(
            getRequiredString(stack, 'id', 'buildpack.toml.stacks'),
            getStringArray(stack, 'mixins', 'buildpack.toml.stacks')
          )
      ),
      getMetadata(data, 'metadata', 'buildpack.toml'),
      getRecordArray(data, 'order', 'buildpack.toml').map(
        (order) =>
          new BuildpackOrder(
            getRecordArray(order, 'group', 'buildpack.toml.order').map(
              (group) =>
                new BuildpackGroupEntry(
                  getRequiredString(group, 'id', 'buildpack.toml.order.group'),
                  getRequiredString(group, 'version', 'buildpack.toml.order.group'),
                  getOptionalBoolean(group, 'optional', 'buildpack.toml.order.group')
                )
            )
          )
      )
    )
  }
}
