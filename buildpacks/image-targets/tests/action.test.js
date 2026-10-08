import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execute = promisify(execFile)
const actionDirectory = dirname(dirname(fileURLToPath(import.meta.url)))
const repositoryRoot = dirname(dirname(actionDirectory))
const yarnPath = join(repositoryRoot, '.yarn/releases/yarn.js')

test('action selects changed dependents and delegates include/exclude globs to Yarn', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'atls-image-targets-fixture-'))
  const root = join(directory, 'project')

  context.after(async () => rm(directory, { recursive: true, force: true }))

  await mkdir(root)

  await Promise.all(
    ['core', 'app', 'site'].map(async (workspace) =>
      mkdir(join(root, 'packages', workspace), { recursive: true })
    )
  )

  await writeFile(join(root, '.yarnrc.yml'), `yarnPath: ${JSON.stringify(yarnPath)}\n`)
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({
      name: 'fixture',
      private: true,
      packageManager: 'yarn@4.14.1',
      workspaces: ['packages/*'],
    })
  )
  await writeFile(join(root, 'packages/core/package.json'), JSON.stringify({ name: '@demo/core' }))
  await writeFile(
    join(root, 'packages/app/package.json'),
    JSON.stringify({
      name: '@demo/app',
      dependencies: { '@demo/core': 'workspace:*' },
      scripts: { start: 'node app.js' },
    })
  )
  await writeFile(
    join(root, 'packages/site/package.json'),
    JSON.stringify({
      name: '@demo/site',
      scripts: { start: 'node site.js' },
    })
  )

  await execute('yarn', ['install'], {
    cwd: root,
    env: { ...process.env, YARN_ENABLE_IMMUTABLE_INSTALLS: 'false' },
  })
  await execute('git', ['init', '-b', 'master'], { cwd: root })
  await execute('git', ['add', '.'], { cwd: root })
  await execute(
    'git',
    ['-c', 'user.name=ATLS Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'base'],
    { cwd: root }
  )
  const { stdout: base } = await execute('git', ['rev-parse', 'HEAD'], { cwd: root })

  await writeFile(join(root, 'packages/core/changed.txt'), 'changed\n')

  const select = async ({ include = '', exclude = '' } = {}) => {
    const output = join(directory, 'action-output.txt')
    await writeFile(output, '')
    await execute(process.execPath, [join(actionDirectory, 'select.js')], {
      cwd: root,
      env: {
        ...process.env,
        BASE_SHA: base.trim(),
        GITHUB_WORKSPACE: root,
        GITHUB_OUTPUT: output,
        INCLUDE: include,
        EXCLUDE: exclude,
      },
    })

    const contents = await readFile(output, 'utf8')

    return JSON.parse(contents.slice('matrix='.length))
  }

  assert.deepEqual(await select(), [{ workspace: '@demo/app', imageName: 'demo-app' }])
  assert.deepEqual(await select({ include: '@demo/*' }), [
    { workspace: '@demo/app', imageName: 'demo-app' },
    { workspace: '@demo/site', imageName: 'demo-site' },
  ])
  assert.deepEqual(await select({ exclude: '@demo/site' }), [
    { workspace: '@demo/app', imageName: 'demo-app' },
  ])
  await assert.rejects(select({ include: '@demo/*', exclude: '@demo/site' }), {
    message: /include and exclude cannot be combined/,
  })
})
