import type { TomlTable }   from './interfaces.js'

import { invalidTomlValue } from '../errors/index.js'
import { isStringArray }    from './guards.js'

export const readRequiredString = (record: TomlTable, key: string, path: string): string => {
  const value = record[key]

  if (typeof value !== 'string') {
    throw invalidTomlValue(`${path}.${key}`, 'a string')
  }

  return value
}

export const readOptionalString = (
  record: TomlTable,
  key: string,
  path: string,
  fallback: string = ''
): string => {
  if (!(key in record)) {
    return fallback
  }

  const value = record[key]

  if (typeof value !== 'string') {
    throw invalidTomlValue(`${path}.${key}`, 'a string')
  }

  return value
}

export const readStringArray = (record: TomlTable, key: string, path: string): Array<string> => {
  if (!(key in record)) {
    return []
  }

  const value = record[key]

  if (!isStringArray(value)) {
    throw invalidTomlValue(`${path}.${key}`, 'a string array')
  }

  return value
}

export const readStringTuple = (record: TomlTable, key: string, path: string): Array<string> => {
  const value = record[key]

  if (!isStringArray(value)) {
    throw invalidTomlValue(`${path}.${key}`, 'a string array')
  }

  return value
}
