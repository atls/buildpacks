import { PortablePath } from '@yarnpkg/fslib'
import { execUtils }    from '@yarnpkg/core'
import { xfs }          from '@yarnpkg/fslib'
import { ppath }        from '@yarnpkg/fslib'

import YAML             from 'yaml'
import { createHash }   from 'crypto'

import { Builder }      from '@atls/libcnb'
import { BuildContext } from '@atls/libcnb'
import { BuildResult }  from '@atls/libcnb'

export class YarnCacheBuilder implements Builder {
  async build(ctx: BuildContext): Promise<BuildResult> {
    const applicationDir = ctx.applicationDir as PortablePath
    const yarnCachePath = ppath.join(applicationDir, '.yarn/cache' as PortablePath)

    const yarnLock = await xfs.readFilePromise(
      ppath.join(applicationDir, 'yarn.lock' as PortablePath)
    )
    const yarnLockCheckSum = createHash('md5').update(yarnLock).digest('hex')

    const cacheLayer = await ctx.layers.get('yarn-cache', true, true, true)

    if (yarnLockCheckSum !== cacheLayer.getMetadata('locksum')) {
      for await (const file of await xfs.readdirPromise(yarnCachePath)) {
        await xfs.copyPromise(
          ppath.join(cacheLayer.path as PortablePath, file),
          ppath.join(yarnCachePath, file)
        )
        await xfs.removePromise(ppath.join(cacheLayer.path as PortablePath, file))
      }

      cacheLayer.setMetadata('locksum', yarnLockCheckSum.toString())
    }

    await xfs.rmdirPromise(yarnCachePath, { recursive: true })

    const yarnrc = await xfs.readFilePromise(
      ppath.join(applicationDir, '.yarnrc.yml' as PortablePath)
    )

    const yarnrcContent = YAML.parse(yarnrc.toString())

    await xfs.writeFilePromise(
      ppath.join(applicationDir, '.yarnrc.yml' as PortablePath),
      YAML.stringify({
        ...yarnrcContent,
        cacheFolder: ppath.relative(applicationDir, cacheLayer.path as PortablePath),
        enableGlobalCache: false,
      })
    )

    await execUtils.pipevp('yarn', ['install', '--immutable'], {
      cwd: applicationDir,
      stdin: process.stdin,
      stdout: process.stdout,
      stderr: process.stderr,
      env: process.env,
    })

    return new BuildResult([cacheLayer])
  }
}
