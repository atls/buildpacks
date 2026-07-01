import { join }           from 'node:path'

import type { BuildOutput } from './interfaces.js'
import type { Metadata }   from '../lifecycle/index.js'
import type { MetadataValue } from '../lifecycle/index.js'
import { Store }          from '../layers/index.js'
import { BOMEntry }       from '../lifecycle/index.js'
import { LaunchFile }     from '../lifecycle/index.js'
import { BuildFile }      from '../lifecycle/index.js'
import { Label }          from '../lifecycle/index.js'
import { Process }        from '../lifecycle/index.js'
import { Slice }          from '../lifecycle/index.js'
import { UnmetPlanEntry } from '../lifecycle/index.js'

interface ResultLayer {
  dump: () => Promise<void>
}

export class BuildResult implements BuildOutput {
  constructor(
    private readonly layers: Array<ResultLayer> = [],
    private readonly store: Store = new Store(),
    private readonly launchFile: LaunchFile = new LaunchFile(),
    private readonly buildFile: BuildFile = new BuildFile()
  ) {}

  addLayer(layer: ResultLayer): this {
    this.layers.push(layer)

    return this
  }

  addLaunchProcess(process: Process): this {
    this.launchFile.processes.push(process)

    return this
  }

  addLaunchLabel(key: string, value: string): this {
    this.launchFile.labels.push(new Label(key, value))

    return this
  }

  addLaunchSlice(paths: Array<string>): this {
    this.launchFile.slices.push(new Slice(paths))

    return this
  }

  addLaunchBOM(name: string, metadata: Metadata = {}): this {
    this.launchFile.bom.push(new BOMEntry(name, metadata))

    return this
  }

  addBuildBOM(name: string, metadata: Metadata = {}): this {
    this.buildFile.bom.push(new BOMEntry(name, metadata))

    return this
  }

  addUnmetPlanEntry(name: string): this {
    this.buildFile.unmet.push(new UnmetPlanEntry(name))

    return this
  }

  setStoreMetadata(key: string, value: MetadataValue): this {
    this.store.metadata[key] = value

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
