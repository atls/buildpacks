import type { MetadataValue } from '../lifecycle/interfaces.js'

export interface LayerEnvironment {
  append: (name: string, value: string, delim?: string) => void
  prepend: (name: string, value: string, delim?: string) => void
  default: (name: string, value: string) => void
  override: (name: string, value: string) => void
}

export interface BuildLayer {
  readonly path: string
  build: boolean
  cache: boolean
  launch: boolean
  readonly sharedEnv: LayerEnvironment
  readonly buildEnv: LayerEnvironment
  readonly launchEnv: LayerEnvironment
  setMetadata: (key: string, value: string | null) => void
  getMetadata: (key: string) => MetadataValue | undefined
  dump: () => Promise<void>
}

export interface LayerCollection {
  get: (
    name: string,
    build?: boolean,
    cache?: boolean,
    launch?: boolean
  ) => Promise<BuildLayer>
}
