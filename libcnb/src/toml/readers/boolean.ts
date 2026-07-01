import type { TomlTable }   from './interfaces.js'

import { invalidTomlValue } from '../errors/index.js'

export const readOptionalBoolean = (
  record: TomlTable,
  key: string,
  path: string,
  fallback: boolean = false
): boolean => {
  if (!(key in record)) {
    return fallback
  }

  const value = record[key]

  if (typeof value !== 'boolean') {
    throw invalidTomlValue(`${path}.${key}`, 'a boolean')
  }

  return value
}
