import type { BuildContext } from './context.interface.js'
import type { BuildResult }  from './result.js'

export interface Builder {
  build(context: BuildContext): Promise<BuildResult>
}
