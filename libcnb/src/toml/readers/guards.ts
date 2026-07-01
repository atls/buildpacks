import type { TomlTable }   from './interfaces.js'

import { invalidTomlValue } from '../errors/index.js'

export const isTomlTable = (value: unknown): value is TomlTable =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const asTomlTable = (value: unknown, path: string): TomlTable => {
  if (!isTomlTable(value)) {
    throw invalidTomlValue(path, 'a table')
  }

  return value
}

export const isStringArray = (value: unknown): value is Array<string> =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string')
