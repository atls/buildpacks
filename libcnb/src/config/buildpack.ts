import type { Metadata }     from '../lifecycle/interfaces.js'
import type { TomlTable }       from '../toml/index.js'

import { BuildpackGroupEntry } from '../buildpack/group-entry.js'
import { BuildpackInfo }       from '../buildpack/info.js'
import { BuildpackLicense }    from '../buildpack/license.js'
import { BuildpackOrder }      from '../buildpack/order.js'
import { BuildpackStack }      from '../buildpack/stack.js'
import { BuildpackTarget }     from '../buildpack/target.js'
import { readMetadata }        from '../toml/index.js'
import { readOptionalBoolean }  from '../toml/index.js'
import { readOptionalString }   from '../toml/index.js'
import { readRequiredTable }   from '../toml/index.js'
import { readRequiredString }   from '../toml/index.js'
import { readTableArray }      from '../toml/index.js'
import { readStringArray }      from '../toml/index.js'
import { readTomlFile }        from '../toml/index.js'

export class BuildpackConfig {
  constructor(
    public readonly api: string,
    public readonly info: BuildpackInfo,
    public readonly path: string,
    public readonly stacks: Array<BuildpackStack> = [],
    public readonly targets: Array<BuildpackTarget> = [],
    public readonly metadata: Metadata = {},
    public readonly order: Array<BuildpackOrder> = []
  ) {}

  static async fromPath(path: string) {
    const data = await readTomlFile(`${path}/buildpack.toml`)

    return BuildpackConfig.fromTomlTable(data, path)
  }

  static fromTomlTable(data: TomlTable, path: string) {
    const buildpack = readRequiredTable(data, 'buildpack', 'buildpack.toml')

    return new BuildpackConfig(
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
      readTableArray(data, 'targets', 'buildpack.toml').map(
        (target) =>
          new BuildpackTarget(
            readOptionalString(target, 'os', 'buildpack.toml.targets'),
            readOptionalString(target, 'arch', 'buildpack.toml.targets'),
            target
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
