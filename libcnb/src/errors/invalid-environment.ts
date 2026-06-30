import { CnbError } from './base.js'

export class InvalidEnvironmentError extends CnbError {
  constructor(name: string) {
    super('invalid-environment', `${name} is not set`)
  }
}
