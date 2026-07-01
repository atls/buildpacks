import type { TomlTable }     from './table.js'

import { parse }              from '@iarna/toml'
import { stringify }          from '@iarna/toml'

import { InvalidConfigError } from '../errors/index.js'
import { asTomlTable }        from './table.js'

export const parseTomlTable = (content: string, path: string): TomlTable => {
  try {
    return asTomlTable(parse(content) as unknown, path)
  } catch (error) {
    if (error instanceof InvalidConfigError) {
      throw error
    }

    throw new InvalidConfigError(`Failed to parse ${path}`, error)
  }
}

export const stringifyTomlTable = (data: TomlTable): string => stringify(data)
