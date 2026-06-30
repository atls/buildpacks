import { CnbError } from './cnb.error.js'

export class InvalidCnbEnvironmentError extends CnbError {
  constructor(name: string) {
    super('invalid-environment', `${name} is not set`)
  }
}
