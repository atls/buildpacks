import { access }    from 'node:fs/promises'

import type { CnbMetadata } from '../metadata/value.interface.js'

import { CnbIoError }       from '../errors/index.js'
import { readMetadata }      from '../toml/index.js'
import { readTomlFile }   from '../toml/index.js'
import { writeTomlFile }  from '../toml/index.js'

export class Store {
  constructor(public readonly metadata: CnbMetadata = {}) {}

  static async fromPath(path: string) {
    try {
      await access(path)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return new Store()
      }

      throw new CnbIoError(`Failed to access ${path}`, error)
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
