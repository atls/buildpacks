import { run }                 from '@atls/libcnb'

import { YarnInstallBuilder }  from './builder.js'
import { YarnInstallDetector } from './detector.js'

run(new YarnInstallDetector(), new YarnInstallBuilder())
