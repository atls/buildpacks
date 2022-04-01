import { run }                        from '@atls/libcnb'

import { YarnWorkspaceStartBuilder }  from './yarn-workspace-start.builder'
import { YarnWorkspaceStartDetector } from './yarn-workspace-start.detector'

run(new YarnWorkspaceStartDetector(), new YarnWorkspaceStartBuilder())

// @ts-ignore
const core = require('@atls/libcnb') // eslint-disable-line
