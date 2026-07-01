import type { Metadata } from '../lifecycle/interfaces.js'

export class BuildpackTarget {
  constructor(
    public readonly os: string = '',
    public readonly arch: string = '',
    public readonly metadata: Metadata = {}
  ) {}
}
