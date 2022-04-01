import { readFile }            from 'node:fs/promises'
import { join }                from 'node:path'

import { parse }               from '@iarna/toml'

import { BuildpackGroupEntry } from './buildpack.group-entry'
import { BuildpackInfo }       from './buildpack.info'
import { BuildpackLicense }    from './buildpack.license'
import { BuildpackOrder }      from './buildpack.order'
import { BuildpackStack }      from './buildpack.stack'

export class Buildpack {
  constructor(
    public readonly api: string,
    public readonly info: BuildpackInfo,
    public readonly path: string,
    public readonly stacks: Array<BuildpackStack> = [],
    public readonly metadata: { [key: string]: any } = {},
    public readonly order: Array<BuildpackOrder> = []
  ) {}

  static async fromPath(path: string) {
    const data: any = parse(await readFile(join(path, 'buildpack.toml'), 'utf-8'))

    return new Buildpack(
      data.api,
      new BuildpackInfo(
        data.buildpack.id,
        data.buildpack.version,
        data.buildpack.name,
        data.buildpack.homepage,
        data.buildpack['clear-env'],
        data.buildpack.description,
        data.buildpack.keywords,
        (data.buildpack.licenses || []).map(
          (license) => new BuildpackLicense(license.type, license.uri)
        )
      ),
      path,
      (data.stacks || []).map((stack) => new BuildpackStack(stack.id, stack.mixins)),
      data.metadata,
      (data.order || []).map(
        (order) =>
          new BuildpackOrder(
            (order.group || []).map(
              (group) => new BuildpackGroupEntry(group.id, group.version, group.optional)
            )
          )
      )
    )
  }
}
