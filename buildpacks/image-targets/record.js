import { appendFile, realpath } from 'node:fs/promises'
import { isAbsolute, relative, sep } from 'node:path'

const root = process.env.IMAGE_TARGETS_ROOT
const output = process.env.IMAGE_TARGETS_FILE

if (!root || !output) {
  throw new Error('Missing image target selection paths')
}

const location = relative(await realpath(root), await realpath(process.cwd())) || '.'

if (isAbsolute(location) || location === '..' || location.startsWith(`..${sep}`)) {
  throw new Error(`Workspace is outside project root: ${location}`)
}

await appendFile(output, `${location}\n`)
