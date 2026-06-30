import { run }               from '@atls/libcnb'

import { YarnCacheBuilder }  from './builder.js'
import { YarnCacheDetector } from './detector.js'

run(new YarnCacheDetector(), new YarnCacheBuilder())
