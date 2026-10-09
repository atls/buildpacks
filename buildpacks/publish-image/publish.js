import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export const publishImage = async ({
  image,
  latestImage,
  workspace,
  builder,
  buildpack,
  buildEnv = '',
  environment = process.env,
  pack = 'pack',
  path = environment.GITHUB_WORKSPACE || process.cwd(),
  temporaryRoot = environment.RUNNER_TEMP || tmpdir(),
}) => {
  if (!image || !latestImage || !workspace || !builder || !buildpack) {
    throw new Error('Pack publication requires both image tags, workspace, builder, and buildpack')
  }

  let temporaryDirectory

  try {
    const args = [
      'build',
      image,
      '--builder',
      builder,
      '--buildpack',
      buildpack,
      '--path',
      path,
      '--env',
      `WORKSPACE=${workspace}`,
      '--env',
      'SKILLS_NPM_TOKEN',
      '--tag',
      latestImage,
      '--publish',
      '--trust-builder',
    ]

    if (buildEnv) {
      temporaryDirectory = await mkdtemp(join(temporaryRoot, 'atls-pack-build-'))
      const environmentFile = join(temporaryDirectory, 'env')
      await writeFile(environmentFile, buildEnv.endsWith('\n') ? buildEnv : `${buildEnv}\n`, {
        mode: 0o600,
      })
      args.push('--env-file', environmentFile)
    }

    const packEnvironment = { ...environment }
    delete packEnvironment.BUILD_ENV
    delete packEnvironment.INPUT_BUILDENV

    await new Promise((resolve, reject) => {
      const child = spawn(pack, args, { env: packEnvironment, stdio: 'inherit' })

      child.once('error', reject)
      child.once('close', (code, signal) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Pack exited with ${signal || `code ${code}`}`))
        }
      })
    })
  } finally {
    if (temporaryDirectory) {
      await rm(temporaryDirectory, { recursive: true, force: true })
    }
  }
}

export const runAction = (environment = process.env, options = {}) =>
  publishImage({
    image: environment.INPUT_IMAGE,
    latestImage: environment.INPUT_LATESTIMAGE,
    workspace: environment.INPUT_WORKSPACE,
    builder: environment.INPUT_BUILDER,
    buildpack: environment.INPUT_BUILDPACK,
    buildEnv: environment.INPUT_BUILDENV,
    environment,
    ...options,
  })

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runAction()
}
