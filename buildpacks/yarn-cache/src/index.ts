import { run }               from '@atls/libcnb'

import { YarnCacheBuilder }  from './yarn-cache.builder'
import { YarnCacheDetector } from './yarn-cache.detector'

run(new YarnCacheDetector(), new YarnCacheBuilder())

// @ts-ignore
const core = require('@atls/libcnb') // eslint-disable-line
