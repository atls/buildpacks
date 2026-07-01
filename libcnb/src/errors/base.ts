export type CnbErrorReason =
  | 'invalid-config'
  | 'invalid-environment'
  | 'io-failure'
  | 'unsupported-phase'

export class CnbError extends Error {
  constructor(
    public readonly reason: CnbErrorReason,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
  }
}
