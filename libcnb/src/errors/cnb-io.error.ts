import { CnbError } from './cnb.error.js'

export class CnbIoError extends CnbError {
  constructor(message: string, cause?: unknown) {
    super('io-failure', message, cause)
  }
}
