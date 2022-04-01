import { existsSync } from 'node:fs'
import { writeFile }  from 'node:fs/promises'
import { readFile }   from 'node:fs/promises'
import { readdir }    from 'node:fs/promises'
import { mkdir }      from 'node:fs/promises'
import { join }       from 'node:path'

export class Environment {
  constructor(private readonly data: Map<string, string> = new Map<string, string>()) {}

  static async fromPath(path: string) {
    const suffixes = ['.append', '.prepend', '.default', '.delim', '.override']
    const data = new Map<string, string>()

    if (existsSync(path)) {
      const files = await readdir(path)

      for await (const file of files) {
        if (suffixes.some((suffix) => file.endsWith(suffix))) {
          data.set(file, await readFile(join(path, file), 'utf-8'))
        }
      }
    }

    return new Environment(data)
  }

  append(name: string, value: string, delim: string = ':') {
    this.data.set(`${name}.append`, value)
    this.data.set(`${name}.delim`, delim)
  }

  prepend(name: string, value: string, delim: string = ':') {
    this.data.set(`${name}.prepend`, value)
    this.data.set(`${name}.delim`, delim)
  }

  default(name: string, value: string) {
    this.data.set(`${name}.default`, value)
  }

  override(name: string, value: string) {
    this.data.set(`${name}.override`, value)
  }

  async toPath(path: string) {
    if (!existsSync(path)) {
      await mkdir(path)
    }

    for await (const [key, value] of this.data.entries()) {
      await writeFile(join(path, key), value)
    }
  }
}
