import type { TomlTable } from './interfaces.js'

import { asTomlTable }    from './guards.js'

export const readMetadata = (record: TomlTable, key: string, path: string): TomlTable => {
  if (!(key in record)) {
    return {}
  }

  const value = record[key]

  return asTomlTable(value, `${path}.${key}`)
}
