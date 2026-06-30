import { parse }     from '@iarna/toml'
import { stringify } from '@iarna/toml'

import { InvalidCnbConfigError } from '../errors/index.js'
import { asTomlTable } from './table.js'
import type { TomlTable } from './table.js'

export const parseTomlTable = (content: string, path: string): TomlTable => {
  try {
    return asTomlTable(parse(content) as unknown, path)
  } catch (error) {
    if (error instanceof InvalidCnbConfigError) {
      throw error
    }

    throw new InvalidCnbConfigError(`Failed to parse ${path}`, error)
  }
}

export const stringifyTomlTable = (data: TomlTable): string => stringify(data)
