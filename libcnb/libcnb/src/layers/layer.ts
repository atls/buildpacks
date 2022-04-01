import { existsSync }  from 'node:fs'
import { readFile }    from 'node:fs/promises'
import { rmdir }       from 'node:fs/promises'
import { unlink }      from 'node:fs/promises'
import { writeFile }   from 'node:fs/promises'
import { mkdir }       from 'node:fs/promises'
import { dirname }     from 'node:path'
import { join }        from 'node:path'

import { parse }       from '@iarna/toml'
import { stringify }   from '@iarna/toml'

import { Environment } from './environment'

export class Layer {
  build: boolean = false

  cache: boolean = false

  launch: boolean = false

  metadata: { [key: string]: any } = {}

  sharedEnv: Environment

  buildEnv: Environment

  launchEnv: Environment

  constructor(readonly path: string) {}

  get name() {
    return dirname(this.path)
  }

  get metadataFile() {
    return `${this.path}.toml`
  }

  setMetadata(key: string, value: string | null): void {
    this.metadata[key] = value
  }

  getMetadata(key: string) {
    return this.metadata[key]
  }

  async load() {
    if (existsSync(this.metadataFile)) {
      const metadataFile = parse(await readFile(this.metadataFile, 'utf-8')) as {
        types: {
          build: boolean
          cache: boolean
          launch: boolean
        }
        metadata?: { [key: string]: any }
      }

      this.build = metadataFile.types.build
      this.cache = metadataFile.types.cache
      this.launch = metadataFile.types.launch
      this.metadata = metadataFile.metadata || {}
    }

    this.sharedEnv = await Environment.fromPath(join(this.path, 'env'))
    this.buildEnv = await Environment.fromPath(join(this.path, 'env.build'))
    this.launchEnv = await Environment.fromPath(join(this.path, 'env.launch'))
  }

  async dump() {
    await mkdir(this.path, { recursive: true })

    await writeFile(
      this.metadataFile,
      stringify({
        metadata: this.metadata,
        types: {
          build: this.build,
          cache: this.cache,
          launch: this.launch,
        },
      })
    )

    this.sharedEnv.toPath(join(this.path, 'env'))
    this.buildEnv.toPath(join(this.path, 'env.build'))
    this.launchEnv.toPath(join(this.path, 'env.launch'))
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
