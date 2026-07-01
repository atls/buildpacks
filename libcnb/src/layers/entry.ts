import type { Metadata }       from '../lifecycle/interfaces.js'
import type { MetadataValue }  from '../lifecycle/interfaces.js'
import type { BuildLayer }     from './interfaces.js'

/* eslint-disable n/no-sync */
import { existsSync }          from 'node:fs'
import { rmdir }               from 'node:fs/promises'
import { unlink }              from 'node:fs/promises'
import { mkdir }               from 'node:fs/promises'
import { basename }            from 'node:path'
import { join }                from 'node:path'

import { Environment }         from './environment.js'
import { readMetadata }        from '../toml/index.js'
import { readOptionalBoolean } from '../toml/index.js'
import { readOptionalTable }   from '../toml/index.js'
import { readTomlFile }        from '../toml/index.js'
import { writeTomlFile }       from '../toml/index.js'

export class Layer implements BuildLayer {
  build: boolean = false

  cache: boolean = false

  launch: boolean = false

  metadata: Metadata = {}

  sharedEnv: Environment = new Environment()

  buildEnv: Environment = new Environment()

  launchEnv: Environment = new Environment()

  constructor(readonly path: string) {}

  get name() {
    return basename(this.path)
  }

  get metadataFile() {
    return `${this.path}.toml`
  }

  setMetadata(key: string, value: MetadataValue | null): void {
    if (value === null) {
      this.metadata = Object.fromEntries(
        Object.entries(this.metadata).filter(([metadataKey]) => metadataKey !== key)
      )

      return
    }

    this.metadata[key] = value
  }

  getMetadata(key: string): MetadataValue | undefined {
    return this.metadata[key]
  }

  async load() {
    if (existsSync(this.metadataFile)) {
      const metadataFile = await readTomlFile(this.metadataFile)
      const types = readOptionalTable(metadataFile, 'types', this.metadataFile)

      this.build = readOptionalBoolean(types, 'build', `${this.metadataFile}.types`)
      this.cache = readOptionalBoolean(types, 'cache', `${this.metadataFile}.types`)
      this.launch = readOptionalBoolean(types, 'launch', `${this.metadataFile}.types`)
      this.metadata = readMetadata(metadataFile, 'metadata', this.metadataFile)
    }

    this.sharedEnv = await Environment.fromPath(join(this.path, 'env'))
    this.buildEnv = await Environment.fromPath(join(this.path, 'env.build'))
    this.launchEnv = await Environment.fromPath(join(this.path, 'env.launch'))
  }

  async dump() {
    await mkdir(this.path, { recursive: true })

    await writeTomlFile(this.metadataFile, {
      metadata: this.metadata,
      types: {
        build: this.build,
        cache: this.cache,
        launch: this.launch,
      },
    })

    await this.sharedEnv.toPath(join(this.path, 'env'))
    await this.buildEnv.toPath(join(this.path, 'env.build'))
    await this.launchEnv.toPath(join(this.path, 'env.launch'))
  }

  async reset() {
    if (existsSync(this.metadataFile)) {
      await unlink(this.metadataFile)
    }

    if (existsSync(this.path)) {
      await rmdir(this.path)
    }

    await mkdir(this.path, { recursive: true })

    await this.load()
  }
}
