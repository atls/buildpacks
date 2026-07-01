import type { Metadata }      from '../lifecycle/interfaces.js'

import { InvalidConfigError } from '../errors/index.js'

export type TomlTable = Metadata

export const isTomlTable = (value: unknown): value is TomlTable =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const asTomlTable = (value: unknown, path: string): TomlTable => {
  if (!isTomlTable(value)) {
    throw new InvalidConfigError(`${path} must be a table`)
  }

  return value
}

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
    throw new InvalidConfigError(`${path}.${key} must be an array`)
  }

  return value.map((entry, index) => asTomlTable(entry, `${path}.${key}[${index}]`))
}

export const readRequiredString = (record: TomlTable, key: string, path: string): string => {
  const value = record[key]

  if (typeof value !== 'string') {
    throw new InvalidConfigError(`${path}.${key} must be a string`)
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
    throw new InvalidConfigError(`${path}.${key} must be a string`)
  }

  return value
}

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
    throw new InvalidConfigError(`${path}.${key} must be a boolean`)
  }

  return value
}

const isStringArray = (value: unknown): value is Array<string> =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string')

export const readStringArray = (record: TomlTable, key: string, path: string): Array<string> => {
  if (!(key in record)) {
    return []
  }

  const value = record[key]

  if (!isStringArray(value)) {
    throw new InvalidConfigError(`${path}.${key} must be a string array`)
  }

  return value
}

export const readStringTuple = (record: TomlTable, key: string, path: string): Array<string> => {
  const value = record[key]

  if (!isStringArray(value)) {
    throw new InvalidConfigError(`${path}.${key} must be a string array`)
  }

  return value
}

export const readMetadata = (record: TomlTable, key: string, path: string): Metadata => {
  if (!(key in record)) {
    return {}
  }

  const value = record[key]

  return asTomlTable(value, `${path}.${key}`)
}
