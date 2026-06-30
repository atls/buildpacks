import { InvalidConfigError } from '../errors/index.js'
import type { BuildArguments } from './interfaces.js'
import type { DetectArguments } from './interfaces.js'

const resolveRequiredArgument = (
  argv: Array<string>,
  index: number,
  name: string
): string => {
  const value = argv[index]

  if (!value) {
    throw new InvalidConfigError(`${name} argument is required`)
  }

  return value
}

export const resolveDetectArguments = (argv: Array<string> = process.argv): DetectArguments => ({
  platformDir: resolveRequiredArgument(argv, 2, 'platform dir'),
  planPath: resolveRequiredArgument(argv, 3, 'plan path'),
})

export const resolveBuildArguments = (argv: Array<string> = process.argv): BuildArguments => ({
  layersDir: resolveRequiredArgument(argv, 2, 'layers dir'),
  platformDir: resolveRequiredArgument(argv, 3, 'platform dir'),
  planPath: resolveRequiredArgument(argv, 4, 'plan path'),
})
