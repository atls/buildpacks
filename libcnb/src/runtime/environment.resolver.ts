import { InvalidCnbEnvironmentError } from '../errors/index.js'
import type { CnbEnvironment } from './environment.interface.js'

const resolveRequiredEnv = (
  env: NodeJS.ProcessEnv,
  name: string
): string => {
  const value = env[name]

  if (!value) {
    throw new InvalidCnbEnvironmentError(name)
  }

  return value
}

export const resolveCnbEnvironment = (
  env: NodeJS.ProcessEnv = process.env
): CnbEnvironment => ({
  buildpackDir: resolveRequiredEnv(env, 'CNB_BUILDPACK_DIR'),
  stackId: resolveRequiredEnv(env, 'CNB_STACK_ID'),
})
