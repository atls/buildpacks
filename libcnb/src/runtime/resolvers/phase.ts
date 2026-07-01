import { basename } from 'node:path'

export type CnbPhase = 'build' | 'detect'

export const resolveCnbPhase = (argv: Array<string> = process.argv): string =>
  basename(argv[1] ?? '')

export const isCnbPhase = (phase: string): phase is CnbPhase =>
  phase === 'build' || phase === 'detect'
