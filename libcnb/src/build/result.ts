import { join }           from 'node:path'

import type { BuildLayer } from '../layers/index.js'
import { Store }          from '../layers/index.js'
import { LaunchFile }     from '../lifecycle/index.js'
import { BuildFile }      from '../lifecycle/index.js'
import { Process }        from '../lifecycle/index.js'

export class BuildResult {
  constructor(
    private readonly layers: Array<BuildLayer> = [],
    private readonly store: Store = new Store(),
    private readonly launchFile: LaunchFile = new LaunchFile(),
    private readonly buildFile: BuildFile = new BuildFile()
  ) {}

  addLayer(layer: BuildLayer): this {
    this.layers.push(layer)

    return this
  }

  addLaunchProcess(process: Process): this {
    this.launchFile.processes.push(process)

    return this
  }

  async toPath(path: string) {
    for await (const layer of this.layers) {
      await layer.dump()
    }

    await this.store.toPath(join(path, 'store.toml'))
    await this.launchFile.toPath(join(path, 'launch.toml'))
    await this.buildFile.toPath(join(path, 'build.toml'))
  }
}
