import { access }    from 'node:fs/promises'

import type { CnbMetadata } from '../metadata.js'

import { CnbIoError }       from '../errors/index.js'
import { getMetadata }      from '../raw/index.js'
import { readTomlRecord }   from '../raw/index.js'
import { writeTomlRecord }  from '../raw/index.js'

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

    const data = await readTomlRecord(path)

    return new Store(getMetadata(data, 'metadata', 'store.toml'))
  }

  async toPath(path: string) {
    if (Object.keys(this.metadata).length > 0) {
      await writeTomlRecord(path, {
        metadata: this.metadata,
      })
    }
  }
}
