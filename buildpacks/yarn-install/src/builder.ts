import type { Builder }      from '@atls/libcnb'
import type { BuildContext } from '@atls/libcnb'

import { BuildResult }       from '@atls/libcnb'
import execa                 from 'execa'

export class YarnInstallBuilder implements Builder {
  async build(ctx: BuildContext): Promise<BuildResult> {
    if (ctx.platform.env.get('BP_YARN_WORKSPACE')) {
      return new BuildResult()
    }

    await execa('yarn', ['install', '--immutable', '--inline-builds'], {
      stdin: 'inherit',
    })

    return new BuildResult()
  }
}
