import { CnbError } from './cnb.error.js'

export class InvalidCnbConfigError extends CnbError {
  constructor(message: string, cause?: unknown) {
    super('invalid-config', message, cause)
  }
}
