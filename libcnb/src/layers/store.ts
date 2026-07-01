import type { Metadata } from '../lifecycle/interfaces.js'

import { access }        from 'node:fs/promises'

import { IoError }       from '../errors/index.js'
import { readMetadata }  from '../toml/index.js'
import { readTomlFile }  from '../toml/index.js'
import { writeTomlFile } from '../toml/index.js'

export class Store {
  constructor(public readonly metadata: Metadata = {}) {}

  static async fromPath(path: string) {
    try {
      await access(path)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return new Store()
      }

      throw new IoError(`Failed to access ${path}`, error)
    }

    const data = await readTomlFile(path)

    return new Store(readMetadata(data, 'metadata', 'store.toml'))
  }

  async toPath(path: string) {
    if (Object.keys(this.metadata).length > 0) {
      await writeTomlFile(path, {
        metadata: this.metadata,
      })
    }
  }
}
