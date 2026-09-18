import type { Builder }      from '@atls/libcnb'
import type { BuildContext } from '@atls/libcnb'

import { BuildResult }       from '@atls/libcnb'
import execa                 from 'execa'

export class YarnInstallBuilder implements Builder {
  async build(ctx: BuildContext): Promise<BuildResult> {
    await execa('yarn', ['install', '--immutable', '--inline-builds'], {
      stdin: 'inherit',
    })

    return new BuildResult()
  }
}
