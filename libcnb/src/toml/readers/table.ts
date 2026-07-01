import type { TomlTable }   from './interfaces.js'

import { invalidTomlValue } from '../errors/index.js'
import { asTomlTable }      from './guards.js'

export const readRequiredTable = (record: TomlTable, key: string, path: string): TomlTable =>
  asTomlTable(record[key], `${path}.${key}`)

export const readOptionalTable = (record: TomlTable, key: string, path: string): TomlTable => {
  if (!(key in record)) {
    return {}
  }

  const value = record[key]

  return asTomlTable(value, `${path}.${key}`)
}

export const readTableArray = (record: TomlTable, key: string, path: string): Array<TomlTable> => {
  if (!(key in record)) {
    return []
  }

  const value = record[key]

  if (!Array.isArray(value)) {
    throw invalidTomlValue(`${path}.${key}`, 'an array')
  }

  return value.map((entry, index) => asTomlTable(entry, `${path}.${key}[${index}]`))
}
