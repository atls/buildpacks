import { CnbError } from './base.js'

export class IoError extends CnbError {
  constructor(message: string, cause?: unknown) {
    super('io-failure', message, cause)
  }
}
