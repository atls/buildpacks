import type { TomlTable } from './table.js'

import { readFile }       from 'node:fs/promises'
import { writeFile }      from 'node:fs/promises'

import { CnbIoError }     from '../errors/index.js'
import { parseTomlTable } from './document.js'
import { stringifyTomlTable } from './document.js'

export const readTomlFile = async (path: string): Promise<TomlTable> => {
  let content: string

  try {
    content = await readFile(path, 'utf-8')
  } catch (error) {
    throw new CnbIoError(`Failed to read ${path}`, error)
  }

  return parseTomlTable(content, path)
}

export const writeTomlFile = async (path: string, data: TomlTable): Promise<void> => {
  try {
    await writeFile(path, stringifyTomlTable(data))
  } catch (error) {
    throw new CnbIoError(`Failed to write ${path}`, error)
  }
}
