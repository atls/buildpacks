import { InvalidCnbConfigError } from '../errors/index.js'

export interface DetectArguments {
  platformDir: string
  planPath: string
}

export interface BuildArguments {
  layersDir: string
  platformDir: string
  planPath: string
}

const getRequiredArgument = (
  argv: Array<string>,
  index: number,
  name: string
): string => {
  const value = argv[index]

  if (!value) {
    throw new InvalidCnbConfigError(`${name} argument is required`)
  }

  return value
}

export const resolveDetectArguments = (argv: Array<string> = process.argv): DetectArguments => ({
  platformDir: getRequiredArgument(argv, 2, 'platform dir'),
  planPath: getRequiredArgument(argv, 3, 'plan path'),
})

export const resolveBuildArguments = (argv: Array<string> = process.argv): BuildArguments => ({
  layersDir: getRequiredArgument(argv, 2, 'layers dir'),
  platformDir: getRequiredArgument(argv, 3, 'platform dir'),
  planPath: getRequiredArgument(argv, 4, 'plan path'),
})
