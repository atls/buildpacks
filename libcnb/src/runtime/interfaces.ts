export interface DetectArguments {
  platformDir: string
  planPath: string
}

export interface BuildArguments {
  layersDir: string
  platformDir: string
  planPath: string
}

export interface CnbEnvironment {
  buildpackDir: string
  stackId: string
}
