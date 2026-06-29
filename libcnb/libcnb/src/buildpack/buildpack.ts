/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
import { readFile }            from 'node:fs/promises'
import { join }                from 'node:path'

import { parse }               from '@iarna/toml'

import { BuildpackGroupEntry } from './buildpack.group-entry.js'
import { BuildpackInfo }       from './buildpack.info.js'
import { BuildpackLicense }    from './buildpack.license.js'
import { BuildpackOrder }      from './buildpack.order.js'
import { BuildpackStack }      from './buildpack.stack.js'

export class Buildpack {
  constructor(
    public readonly api: string,
    public readonly info: BuildpackInfo,
    public readonly path: string,
    public readonly stacks: Array<BuildpackStack> = [],
    public readonly metadata: Record<string, any> = {},
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
          (license: any) => new BuildpackLicense(license.type, license.uri)
        )
      ),
      path,
      (data.stacks || []).map((stack: any) => new BuildpackStack(stack.id, stack.mixins)),
      data.metadata,
      (data.order || []).map(
        (order: any) =>
          new BuildpackOrder(
            (order.group || []).map(
              (group: any) => new BuildpackGroupEntry(group.id, group.version, group.optional)
            )
          )
      )
    )
  }
}
