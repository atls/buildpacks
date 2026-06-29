import type { Builder } from '@atls/libcnb'

import execa            from 'execa'

import { BuildResult }  from '@atls/libcnb'

export class YarnInstallBuilder implements Builder {
  async build(): Promise<BuildResult> {
    await execa('yarn', ['install', '--immutable', '--inline-builds'], {
      stdin: 'inherit',
    })

    return new BuildResult()
  }
}
