import assert from 'node:assert/strict'
import { access, chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { publishImage, runAction } from '../publish.js'

test('Pack receives the image tags and a private temporary build environment', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'atls-publish-image-test-'))
  const pack = join(directory, 'pack.mjs')
  const log = join(directory, 'pack.json')
  const secret = 'NEXT_PUBLIC_URL=https://example.invalid'

  context.after(async () => rm(directory, { recursive: true, force: true }))

  await writeFile(
    pack,
    [
      '#!/usr/bin/env node',
      "import { readFileSync, statSync, writeFileSync } from 'node:fs'",
      'const args = process.argv.slice(2)',
      "const index = args.indexOf('--env-file')",
      'const environmentFile = index < 0 ? undefined : args[index + 1]',
      'writeFileSync(process.env.PACK_LOG_FILE, JSON.stringify({',
      '  args,',
      '  environmentFile,',
      "  contents: environmentFile ? readFileSync(environmentFile, 'utf8') : null,",
      '  mode: environmentFile ? statSync(environmentFile).mode & 0o777 : null,',
      '  inheritedBuildEnv: process.env.BUILD_ENV,',
      '  inheritedActionBuildEnv: process.env.INPUT_BUILDENV,',
      '}))',
      "if (process.env.PACK_FAIL === '1') process.exit(7)",
    ].join('\n')
  )
  await chmod(pack, 0o700)

  const options = {
    image: 'ghcr.io/atls/app:revision',
    latestImage: 'ghcr.io/atls/app:latest',
    workspace: '@atls/app',
    builder: 'ghcr.io/atls/builder-base:24',
    buildpack: 'ghcr.io/atls/buildpack-yarn-workspace:24',
    buildEnv: secret,
    environment: {
      ...process.env,
      BUILD_ENV: secret,
      SKILLS_NPM_TOKEN: 'test-token',
      PACK_LOG_FILE: log,
    },
    pack,
    path: directory,
    temporaryRoot: directory,
  }

  await publishImage(options)

  const result = JSON.parse(await readFile(log, 'utf8'))

  assert.deepEqual(result.args.slice(0, 4), ['build', options.image, '--builder', options.builder])
  assert.ok(result.args.includes(options.buildpack))
  assert.ok(result.args.includes(`WORKSPACE=${options.workspace}`))
  assert.ok(result.args.includes(options.latestImage))
  assert.ok(result.args.includes('--publish'))
  assert.equal(result.contents, `${secret}\n`)
  assert.equal(result.mode, 0o600)
  assert.equal(result.inheritedBuildEnv, undefined)
  await assert.rejects(access(result.environmentFile), { code: 'ENOENT' })

  await assert.rejects(
    publishImage({
      ...options,
      environment: { ...options.environment, PACK_FAIL: '1' },
    }),
    /Pack exited with code 7/
  )
  const failed = JSON.parse(await readFile(log, 'utf8'))
  await assert.rejects(access(failed.environmentFile), { code: 'ENOENT' })

  await publishImage({ ...options, buildEnv: '' })
  const withoutBuildEnv = JSON.parse(await readFile(log, 'utf8'))
  assert.equal(withoutBuildEnv.environmentFile, undefined)

  await runAction(
    {
      ...options.environment,
      INPUT_IMAGE: options.image,
      INPUT_LATESTIMAGE: options.latestImage,
      INPUT_WORKSPACE: options.workspace,
      INPUT_BUILDER: options.builder,
      INPUT_BUILDPACK: options.buildpack,
      INPUT_BUILDENV: secret,
    },
    { pack, path: directory, temporaryRoot: directory }
  )
  const actionResult = JSON.parse(await readFile(log, 'utf8'))
  assert.ok(actionResult.args.includes(options.image))
  assert.equal(actionResult.contents, `${secret}\n`)
  assert.equal(actionResult.inheritedActionBuildEnv, undefined)
  await assert.rejects(access(actionResult.environmentFile), { code: 'ENOENT' })

  await assert.rejects(publishImage({ ...options, latestImage: '' }), {
    message: /requires both image tags/,
  })
})
