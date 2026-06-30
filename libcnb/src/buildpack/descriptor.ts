import type { CnbMetadata }     from '../metadata/value.interface.js'
import type { TomlTable }       from '../toml/index.js'

import { BuildpackGroupEntry } from './group-entry.js'
import { BuildpackInfo }       from './info.js'
import { BuildpackLicense }    from './license.js'
import { BuildpackOrder }      from './order.js'
import { BuildpackStack }      from './stack.js'
import { readMetadata }        from '../toml/index.js'
import { readOptionalBoolean }  from '../toml/index.js'
import { readOptionalString }   from '../toml/index.js'
import { readRequiredTable }   from '../toml/index.js'
import { readRequiredString }   from '../toml/index.js'
import { readTableArray }      from '../toml/index.js'
import { readStringArray }      from '../toml/index.js'
import { readTomlFile }        from '../toml/index.js'

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
    const data = await readTomlFile(`${path}/buildpack.toml`)

    return Buildpack.fromTomlTable(data, path)
  }

  static fromTomlTable(data: TomlTable, path: string) {
    const buildpack = readRequiredTable(data, 'buildpack', 'buildpack.toml')

    return new Buildpack(
      readRequiredString(data, 'api', 'buildpack.toml'),
      new BuildpackInfo(
        readRequiredString(buildpack, 'id', 'buildpack.toml.buildpack'),
        readRequiredString(buildpack, 'version', 'buildpack.toml.buildpack'),
        readOptionalString(buildpack, 'name', 'buildpack.toml.buildpack'),
        readOptionalString(buildpack, 'homepage', 'buildpack.toml.buildpack'),
        readOptionalBoolean(buildpack, 'clear-env', 'buildpack.toml.buildpack'),
        readOptionalString(buildpack, 'description', 'buildpack.toml.buildpack'),
        readStringArray(buildpack, 'keywords', 'buildpack.toml.buildpack'),
        readTableArray(buildpack, 'licenses', 'buildpack.toml.buildpack').map(
          (license) =>
            new BuildpackLicense(
              readOptionalString(license, 'type', 'buildpack.toml.buildpack.licenses'),
              readOptionalString(license, 'uri', 'buildpack.toml.buildpack.licenses')
            )
        )
      ),
      path,
      readTableArray(data, 'stacks', 'buildpack.toml').map(
        (stack) =>
          new BuildpackStack(
            readRequiredString(stack, 'id', 'buildpack.toml.stacks'),
            readStringArray(stack, 'mixins', 'buildpack.toml.stacks')
          )
      ),
      readMetadata(data, 'metadata', 'buildpack.toml'),
      readTableArray(data, 'order', 'buildpack.toml').map(
        (order) =>
          new BuildpackOrder(
            readTableArray(order, 'group', 'buildpack.toml.order').map(
              (group) =>
                new BuildpackGroupEntry(
                  readRequiredString(group, 'id', 'buildpack.toml.order.group'),
                  readRequiredString(group, 'version', 'buildpack.toml.order.group'),
                  readOptionalBoolean(group, 'optional', 'buildpack.toml.order.group')
                )
            )
          )
      )
    )
  }
}
