import { join }           from 'node:path'

import type { BuildLayer } from '../layers/index.js'
import { Store }          from '../layers/index.js'
import { LaunchMetadata } from '../metadata/index.js'
import { BuildMetadata }  from '../metadata/index.js'
import { Process }        from '../metadata/index.js'

export class BuildResult {
  constructor(
    private readonly layers: Array<BuildLayer> = [],
    private readonly store: Store = new Store(),
    private readonly launchMetadata: LaunchMetadata = new LaunchMetadata(),
    private readonly buildMetadata: BuildMetadata = new BuildMetadata()
  ) {}

  addLayer(layer: BuildLayer): this {
    this.layers.push(layer)

    return this
  }

  addLaunchProcess(process: Process): this {
    this.launchMetadata.processes.push(process)

    return this
  }

  async toPath(path: string) {
    for await (const layer of this.layers) {
      await layer.dump()
    }

    await this.store.toPath(join(path, 'store.toml'))
    await this.launchMetadata.toPath(join(path, 'launch.toml'))
    await this.buildMetadata.toPath(join(path, 'build.toml'))
  }
}
