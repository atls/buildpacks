import type { RawRecord } from './record.js'

import { readFile }       from 'node:fs/promises'
import { writeFile }      from 'node:fs/promises'

import { parse }          from '@iarna/toml'
import { stringify }      from '@iarna/toml'

import { CnbIoError }     from '../errors/index.js'
import { InvalidCnbConfigError } from '../errors/index.js'
import { asRawRecord }    from './record.js'

export const readTomlRecord = async (path: string): Promise<RawRecord> => {
  let content: string

  try {
    content = await readFile(path, 'utf-8')
  } catch (error) {
    throw new CnbIoError(`Failed to read ${path}`, error)
  }

  try {
    return asRawRecord(parse(content) as unknown, path)
  } catch (error) {
    if (error instanceof InvalidCnbConfigError) {
      throw error
    }

    throw new InvalidCnbConfigError(`Failed to parse ${path}`, error)
  }
}

export const writeTomlRecord = async (path: string, data: RawRecord): Promise<void> => {
  try {
    await writeFile(path, stringify(data))
  } catch (error) {
    throw new CnbIoError(`Failed to write ${path}`, error)
  }
}
