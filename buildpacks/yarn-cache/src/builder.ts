import type { Builder }      from '@atls/libcnb'
import type { BuildContext } from '@atls/libcnb'

import { BuildResult }       from '@atls/libcnb'
import { Configuration }     from '@yarnpkg/core'
import { execUtils }         from '@yarnpkg/core'
import { npath }             from '@yarnpkg/fslib'

export class YarnCacheBuilder implements Builder {
  async build(ctx: BuildContext): Promise<BuildResult> {
    const applicationDir = npath.toPortablePath(ctx.applicationDir)
    const configuration = await Configuration.find(applicationDir, null, { strict: false })
    const yarnPath = configuration.get('yarnPath')

    if (!yarnPath) {
      throw new Error('Missing required yarnPath for the application Yarn runtime')
    }

    const cacheLayer = await ctx.layers.get('yarn-cache', true, true, true)
    const environment = { YARN_GLOBAL_FOLDER: cacheLayer.path }

    cacheLayer.sharedEnv.default('YARN_GLOBAL_FOLDER', cacheLayer.path)

    await execUtils.pipevp(
      process.execPath,
      [npath.fromPortablePath(yarnPath), 'install', '--immutable', '--inline-builds'],
      {
        cwd: applicationDir,
        stdin: process.stdin,
        stdout: process.stdout,
        stderr: process.stderr,
        env: { ...environment, ...process.env },
        strict: true,
      }
    )

    return new BuildResult().addLayer(cacheLayer)
  }
}
