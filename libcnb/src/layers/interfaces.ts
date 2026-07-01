type LayerMetadataArray =
  | Array<boolean>
  | Array<Date>
  | Array<LayerMetadata>
  | Array<number>
  | Array<string>

type LayerMetadataValue =
  | Array<LayerMetadataArray>
  | Date
  | LayerMetadata
  | LayerMetadataArray
  | boolean
  | number
  | string

interface LayerMetadata {
  [key: string]: LayerMetadataValue
}

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
  setMetadata: (key: string, value: LayerMetadataValue | null) => void
  getMetadata: (key: string) => LayerMetadataValue | undefined
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
