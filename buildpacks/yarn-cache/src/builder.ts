import type { Builder }      from '@atls/libcnb'
import type { BuildContext } from '@atls/libcnb'

import { BuildResult }       from '@atls/libcnb'
import { Configuration }     from '@yarnpkg/core'
import { execUtils }         from '@yarnpkg/core'
import { npath }             from '@yarnpkg/fslib'
import { ppath }             from '@yarnpkg/fslib'

export class YarnCacheBuilder implements Builder {
  async build(ctx: BuildContext): Promise<BuildResult> {
    const applicationDir = npath.toPortablePath(ctx.applicationDir)
    const configuration = await Configuration.find(applicationDir, null, { strict: false })
    const yarnPath = configuration.get('yarnPath')

    if (!yarnPath) {
      throw new Error('Missing required yarnPath for the application Yarn runtime')
    }

    const cacheLayer = await ctx.layers.get('yarn-cache', true, true, true)
    const globalFolder =
      ctx.platform.env.get('YARN_GLOBAL_FOLDER') ?? process.env.YARN_GLOBAL_FOLDER

    if (globalFolder !== undefined && globalFolder !== cacheLayer.path) {
      throw new Error('YARN_GLOBAL_FOLDER must use the buildpack cache layer')
    }

    const cacheFolder = configuration.get('cacheFolder')

    if (
      !configuration.get('enableGlobalCache') &&
      ppath.contains(applicationDir, cacheFolder) === null &&
      ppath.contains(npath.toPortablePath(cacheLayer.path), cacheFolder) === null
    ) {
      throw new Error('Yarn cacheFolder must be inside the application or buildpack cache layer')
    }

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
