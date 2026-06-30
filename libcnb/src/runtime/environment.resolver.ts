import { InvalidEnvironmentError } from '../errors/index.js'
import type { CnbEnvironment } from './interfaces.js'

const resolveRequiredEnv = (
  env: NodeJS.ProcessEnv,
  name: string
): string => {
  const value = env[name]

  if (!value) {
    throw new InvalidEnvironmentError(name)
  }

  return value
}

export const resolveCnbEnvironment = (
  env: NodeJS.ProcessEnv = process.env
): CnbEnvironment => ({
  buildpackDir: resolveRequiredEnv(env, 'CNB_BUILDPACK_DIR'),
  stackId: resolveRequiredEnv(env, 'CNB_STACK_ID'),
})
