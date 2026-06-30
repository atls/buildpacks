import { CnbError } from './cnb.error.js'

export class UnsupportedCnbPhaseError extends CnbError {
  constructor(phase: string) {
    super('unsupported-phase', `Unsupported phase ${phase}`)
  }
}
