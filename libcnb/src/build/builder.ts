import { BuildContext } from './context.js'
import { BuildResult }  from './result.js'

export interface Builder {
  build(context: BuildContext): Promise<BuildResult>
}
