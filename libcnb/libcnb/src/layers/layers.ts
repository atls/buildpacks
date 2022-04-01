import { join }  from 'node:path'

import { Layer } from './layer'

export class Layers {
  private layers: Map<string, Layer> = new Map()

  constructor(readonly path: string) {}

  async get(
    name: string,
    build: boolean = false,
    cache: boolean = false,
    launch: boolean = false
  ): Promise<Layer> {
    if (this.layers.has(name)) {
      return this.layers.get(name)!
    }

    const layer = new Layer(join(this.path, name))

    await layer.load()

    layer.build = build
    layer.cache = cache
    layer.launch = launch

    this.layers.set(name, layer)

    return layer
  }
}
