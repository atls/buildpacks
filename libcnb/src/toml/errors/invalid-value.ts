import { InvalidConfigError } from '../../errors/index.js'

export const invalidTomlValue = (path: string, expected: string): InvalidConfigError =>
  new InvalidConfigError(`${path} must be ${expected}`)
