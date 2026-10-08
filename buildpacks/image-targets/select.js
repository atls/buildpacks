import { execFile } from 'node:child_process'
import { appendFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

import { resolveImageTargets } from './src/targets.js'

const root = process.env.GITHUB_WORKSPACE || process.cwd()
const base = process.env.BASE_SHA
const execute = promisify(execFile)

if (!base) {
  throw new Error('Missing comparison SHA')
}

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
const allMode = include.length > 0 || exclude.length > 0
const changedLocations = allMode
  ? []
  : (await listWorkspaces(`--since=${base}`)).map(({ location }) => location)
let explicitLocations

if (allMode) {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'atls-image-targets-'))
  const output = join(temporaryDirectory, 'locations.txt')
  const recorder = join(dirname(fileURLToPath(import.meta.url)), 'record.js')

  try {
    await writeFile(output, '')

    const flags = [
      ...include.flatMap((glob) => ['--include', glob]),
      ...exclude.flatMap((glob) => ['--exclude', glob]),
    ]

    await execute('yarn', ['workspaces', 'foreach', '--all', ...flags, 'exec', 'node', recorder], {
      cwd: root,
      env: { ...process.env, IMAGE_TARGETS_ROOT: root, IMAGE_TARGETS_FILE: output },
      encoding: 'utf8',
    })

    explicitLocations = (await readFile(output, 'utf8')).split('\n').filter(Boolean)
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
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
