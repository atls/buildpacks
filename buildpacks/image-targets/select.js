import { execFile } from 'node:child_process'
import { appendFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { resolveImageTargets } from './src/targets.js'

const root = process.env.GITHUB_WORKSPACE || process.cwd()
const base = process.env.BASE_SHA
const execute = promisify(execFile)

const include = (process.env.INCLUDE || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)
const exclude = (process.env.EXCLUDE || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

if (include.length > 0 && exclude.length > 0) {
  throw new Error('include and exclude cannot be combined')
}

const allMode = include.length > 0 || exclude.length > 0

if (!allMode && (!base || /^0+$/.test(base))) {
  throw new Error('Changed-workspace selection requires a nonzero comparison SHA')
}

const listWorkspaces = async (...options) => {
  const { stdout } = await execute('yarn', ['workspaces', 'list', '--json', ...options], {
    cwd: root,
    encoding: 'utf8',
  })

  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

const workspaces = await listWorkspaces('--verbose')
const changedLocations = allMode
  ? []
  : (await listWorkspaces(`--since=${base}`)).map(({ location }) => location)
let explicitLocations

if (allMode) {
  const flags = [
    ...include.flatMap((glob) => ['--include', glob]),
    ...exclude.flatMap((glob) => ['--exclude', glob]),
  ]
  const { stdout } = await execute(
    'yarn',
    ['workspaces', 'foreach', '--all', '--dry-run', ...flags, 'exec', 'node'],
    { cwd: root, encoding: 'utf8' }
  )
  const [heading, ...selection] = stdout.trimEnd().split('\n')

  if (heading !== 'Option --all is set; selecting all workspaces') {
    throw new Error('Unexpected Yarn workspace selection output')
  }

  const knownLocations = new Set(workspaces.map(({ location }) => location))
  const excludedLocations = new Set()

  for (const line of selection) {
    const match = line.match(
      /^Excluding (.+) because it (?:doesn't match the --include filter|matches the --exclude filter)$/
    )

    if (!match || !knownLocations.has(match[1])) {
      throw new Error('Unexpected Yarn workspace selection output')
    }

    excludedLocations.add(match[1])
  }

  explicitLocations = workspaces
    .map(({ location }) => location)
    .filter((location) => !excludedLocations.has(location))
}
const manifests = new Map(
  await Promise.all(
    workspaces.map(async ({ location }) => [
      location,
      JSON.parse(await readFile(join(root, location, 'package.json'), 'utf8')),
    ])
  )
)
const targets = resolveImageTargets({ workspaces, changedLocations, explicitLocations, manifests })

if (!process.env.GITHUB_OUTPUT) {
  throw new Error('Missing GitHub Actions output path')
}

await appendFile(process.env.GITHUB_OUTPUT, `matrix=${JSON.stringify(targets)}\n`)
