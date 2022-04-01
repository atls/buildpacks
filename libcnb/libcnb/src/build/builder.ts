import { BuildContext } from './build.context'
import { BuildResult }  from './build.result'

export interface Builder {
  build(context: BuildContext): Promise<BuildResult>
}
