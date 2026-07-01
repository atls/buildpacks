import { run }                        from '@atls/libcnb'

import { YarnWorkspaceStartBuilder }  from './builder.js'
import { YarnWorkspaceStartDetector } from './detector.js'

run(new YarnWorkspaceStartDetector(), new YarnWorkspaceStartBuilder())
