import { CnbError } from './base.js'

export class UnsupportedPhaseError extends CnbError {
  constructor(phase: string) {
    super('unsupported-phase', `Unsupported phase ${phase}`)
  }
}
