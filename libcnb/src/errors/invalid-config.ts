import { CnbError } from './base.js'

export class InvalidConfigError extends CnbError {
  constructor(message: string, cause?: unknown) {
    super('invalid-config', message, cause)
  }
}
