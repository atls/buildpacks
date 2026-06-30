import { InvalidCnbEnvironmentError } from '../errors/index.js'

export interface CnbEnvironment {
  buildpackDir: string
  stackId: string
}

const getRequiredEnv = (
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
  buildpackDir: getRequiredEnv(env, 'CNB_BUILDPACK_DIR'),
  stackId: getRequiredEnv(env, 'CNB_STACK_ID'),
})
