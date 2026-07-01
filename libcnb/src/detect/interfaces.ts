type DetectMetadataArray =
  | Array<boolean>
  | Array<Date>
  | Array<DetectMetadata>
  | Array<number>
  | Array<string>

type DetectMetadataValue =
  | Array<DetectMetadataArray>
  | Date
  | DetectMetadata
  | DetectMetadataArray
  | boolean
  | number
  | string

interface DetectMetadata {
  [key: string]: DetectMetadataValue
}

interface BuildpackInfo {
  readonly clearEnv: boolean
  readonly description: string
  readonly homepage: string
  readonly id: string
  readonly keywords: Array<string>
  readonly name: string
  readonly version: string
}

interface BuildpackStack {
  readonly id: string
  readonly mixins: Array<string>
}

interface BuildpackTarget {
  readonly arch?: string
  readonly os?: string
}

interface Buildpack {
  readonly api: string
  readonly info: BuildpackInfo
  readonly metadata: DetectMetadata
  readonly order: Array<unknown>
  readonly path: string
  readonly stacks: Array<BuildpackStack>
  readonly targets: Array<BuildpackTarget>
}

interface Platform {
  readonly env: ReadonlyMap<string, string>
  readonly path: string
}

interface BuildPlanProvide {
  readonly name: string
}

interface BuildPlanRequire {
  readonly metadata: DetectMetadata
  readonly name: string
}

interface BuildPlan {
  readonly provides: Array<BuildPlanProvide>
  readonly requires: Array<BuildPlanRequire>
}

export interface DetectOutput {
  readonly passed: boolean
  readonly plans: Array<BuildPlan>
}

export interface DetectContext {
  readonly applicationDir: string
  readonly buildpack: Buildpack
  readonly platform: Platform
  readonly stackId: string
}

export interface Detector {
  detect: (context: DetectContext) => Promise<DetectOutput>
}
