import { run }                 from '@atls/libcnb'

import { YarnInstallBuilder }  from './yarn-install.builder.js'
import { YarnInstallDetector } from './yarn-install.detector.js'

run(new YarnInstallDetector(), new YarnInstallBuilder())
