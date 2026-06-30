import type { CnbMetadata } from '../metadata.js'

import { InvalidCnbConfigError } from '../errors/index.js'

export type RawRecord = CnbMetadata

export const isRawRecord = (value: unknown): value is RawRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const asRawRecord = (value: unknown, path: string): RawRecord => {
  if (!isRawRecord(value)) {
    throw new InvalidCnbConfigError(`${path} must be a table`)
  }

  return value
}

export const getRequiredRecord = (record: RawRecord, key: string, path: string): RawRecord =>
  asRawRecord(record[key], `${path}.${key}`)

export const getOptionalRecord = (record: RawRecord, key: string, path: string): RawRecord => {
  if (!(key in record)) {
    return {}
  }

  const value = record[key]

  return asRawRecord(value, `${path}.${key}`)
}

export const getRecordArray = (record: RawRecord, key: string, path: string): Array<RawRecord> => {
  if (!(key in record)) {
    return []
  }

  const value = record[key]

  if (!Array.isArray(value)) {
    throw new InvalidCnbConfigError(`${path}.${key} must be an array`)
  }

  return value.map((entry, index) => asRawRecord(entry, `${path}.${key}[${index}]`))
}

export const getRequiredString = (record: RawRecord, key: string, path: string): string => {
  const value = record[key]

  if (typeof value !== 'string') {
    throw new InvalidCnbConfigError(`${path}.${key} must be a string`)
  }

  return value
}

export const getOptionalString = (
  record: RawRecord,
  key: string,
  path: string,
  fallback: string = ''
): string => {
  if (!(key in record)) {
    return fallback
  }

  const value = record[key]

  if (typeof value !== 'string') {
    throw new InvalidCnbConfigError(`${path}.${key} must be a string`)
  }

  return value
}

export const getOptionalBoolean = (
  record: RawRecord,
  key: string,
  path: string,
  fallback: boolean = false
): boolean => {
  if (!(key in record)) {
    return fallback
  }

  const value = record[key]

  if (typeof value !== 'boolean') {
    throw new InvalidCnbConfigError(`${path}.${key} must be a boolean`)
  }

  return value
}

const isStringArray = (value: unknown): value is Array<string> =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string')

export const getStringArray = (record: RawRecord, key: string, path: string): Array<string> => {
  if (!(key in record)) {
    return []
  }

  const value = record[key]

  if (!isStringArray(value)) {
    throw new InvalidCnbConfigError(`${path}.${key} must be a string array`)
  }

  return value
}

export const getStringTuple = (record: RawRecord, key: string, path: string): Array<string> => {
  const value = record[key]

  if (!isStringArray(value)) {
    throw new InvalidCnbConfigError(`${path}.${key} must be a string array`)
  }

  return value
}

export const getMetadata = (record: RawRecord, key: string, path: string): CnbMetadata => {
  if (!(key in record)) {
    return {}
  }

  const value = record[key]

  return asRawRecord(value, `${path}.${key}`)
}
