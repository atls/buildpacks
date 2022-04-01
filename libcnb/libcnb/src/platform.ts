import { readFile } from 'fs/promises'
import { readdir }  from 'fs/promises'
import { join }     from 'path'

export class Platform {
  constructor(public readonly path: string, public readonly env: Map<string, string> = new Map()) {}

  static async fromPath(path: string) {
    const env: Map<string, string> = new Map()

    for await (const dirent of await readdir(join(path, 'env'), { withFileTypes: true })) {
      if (dirent.isFile()) {
        env.set(dirent.name, await readFile(join(path, 'env', dirent.name), 'utf-8'))
      }
    }

    return new Platform(path, env)
  }
}
