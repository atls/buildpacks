type BuildMetadataArray =
  | Array<boolean>
  | Array<Date>
  | Array<BuildMetadata>
  | Array<number>
  | Array<string>

type BuildMetadataValue =
  | Array<BuildMetadataArray>
  | Date
  | BuildMetadata
  | BuildMetadataArray
  | boolean
  | number
  | string

interface BuildMetadata {
  [key: string]: BuildMetadataValue
}

interface BuildpackInfo {
  readonly clearEnv: boolean
  readonly description: string
  readonly homepage: string
  readonly id: string
  readonly keywords: Array<string>
  readonly licenses: Array<BuildpackLicense>
  readonly name: string
  readonly version: string
}

interface BuildpackLicense {
  readonly type: string
  readonly uri: string
}

interface BuildpackOrder {
  readonly group: Array<BuildpackOrderEntry>
}

interface BuildpackOrderEntry {
  readonly id: string
  readonly optional: boolean
  readonly version: string
}

interface BuildpackStack {
  readonly id: string
  readonly mixins: Array<string>
}

interface BuildpackTarget {
  readonly arch?: string
  readonly metadata: BuildMetadata
  readonly os?: string
}

interface Buildpack {
  readonly api: string
  readonly info: BuildpackInfo
  readonly metadata: BuildMetadata
  readonly order: Array<BuildpackOrder>
  readonly path: string
  readonly stacks: Array<BuildpackStack>
  readonly targets: Array<BuildpackTarget>
}

interface LayerEnvironment {
  append: (name: string, value: string, delim?: string) => void
  prepend: (name: string, value: string, delim?: string) => void
  default: (name: string, value: string) => void
  override: (name: string, value: string) => void
}

interface BuildLayer {
  readonly path: string
  build: boolean
  cache: boolean
  launch: boolean
  readonly sharedEnv: LayerEnvironment
  readonly buildEnv: LayerEnvironment
  readonly launchEnv: LayerEnvironment
  setMetadata: (key: string, value: BuildMetadataValue | null) => void
  getMetadata: (key: string) => BuildMetadataValue | undefined
  dump: () => Promise<void>
}

interface LayerCollection {
  get: (name: string, build?: boolean, cache?: boolean, launch?: boolean) => Promise<BuildLayer>
}

interface Store {
  readonly metadata: BuildMetadata
}

interface BuildPlanEntry {
  readonly metadata: BuildMetadata
  readonly name: string
}

interface BuildPlan {
  readonly entries: Array<BuildPlanEntry>
}

interface Platform {
  readonly env: ReadonlyMap<string, string>
  readonly path: string
}

export interface BuildOutput {
  toPath(path: string): Promise<void>
}

export interface BuildContext {
  readonly applicationDir: string
  readonly buildpack: Buildpack
  readonly layers: LayerCollection
  readonly store: Store
  readonly plan: BuildPlan
  readonly platform: Platform
  readonly stackId: string
}

export interface Builder {
  build(context: BuildContext): Promise<BuildOutput>
}
