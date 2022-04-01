import { run }                 from '@atls/libcnb'

import { YarnInstallBuilder }  from './yarn-install.builder'
import { YarnInstallDetector } from './yarn-install.detector'

run(new YarnInstallDetector(), new YarnInstallBuilder())

// @ts-ignore
const core = require('@atls/libcnb') // eslint-disable-line
