import { BuildContext } from './build.context.js'
import { BuildResult }  from './build.result.js'

export interface Builder {
  build(context: BuildContext): Promise<BuildResult>
}
