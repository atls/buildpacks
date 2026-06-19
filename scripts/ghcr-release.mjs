#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const defaultConfigPath = 'scripts/ghcr-release.config.json'

const usage = `usage: node scripts/ghcr-release.mjs <command> [options]

commands:
  plan                         print GHCR release plan JSON
  eligibility                  print whether this push should release images
  component-status             print version/image/change state for a buildpack or extension
  prepare-buildpack            prepare staged buildpack package config
  verify-buildpack-package     verify packaged buildpack archive content
  builder-config               render builder config for a release tag
  manifest-verify              verify an image manifest contains required platforms
  node-verify                  verify a container reports the expected Node.js major
  trivy-metadata               print Trivy image, SARIF path and category
  trivy-config                 write Trivy platform config
  promotion-plan               print stable tags promoted from temporary release tags
  promote                      promote temporary release tags to stable tags
  check                        run local dry-run checks for the release command layer`

export function loadConfig(configPath = defaultConfigPath) {
  return readJson(configPath)
}

export function releasePlan(options = {}) {
  const config = loadConfig(options.config)
  const sha = shortSha(options.sha || process.env.GITHUB_SHA || gitOutput(['rev-parse', 'HEAD']))
  const nodeLines = readJson(config.nodeLines)
  const defaultNodeMajor = normalizeMajor(nodeLines.default, 'default Node.js major')
  const supportedNodeMajors = nodeLines.supported.map((major) => normalizeMajor(major, 'supported Node.js major'))
  const baseImage = readDockerfileArg(config.stackBaseDockerfile, 'base_image')
  const dockerfileNodeMajor = normalizeMajor(readDockerfileArg(config.stackBaseDockerfile, 'node_version'), 'Dockerfile node_version')

  if (dockerfileNodeMajor !== defaultNodeMajor) {
    throw new Error(`${config.stackBaseDockerfile} node_version must match ${config.nodeLines} default`)
  }
  if (supportedNodeMajors.length === 0) {
    throw new Error(`${config.nodeLines} must declare at least one supported Node.js major`)
  }
  if (!supportedNodeMajors.includes(defaultNodeMajor)) {
    throw new Error(`Default Node.js major ${defaultNodeMajor} must be listed in supported Node.js majors`)
  }

  const nodeLinesPlan = supportedNodeMajors.map((nodeMajor) => ({
    node_major: nodeMajor,
    release_tag: `${nodeMajor}-${sha}`,
  }))

  return {
    image_prefix: config.imagePrefix,
    registry: config.registry,
    stack_id: config.stackId,
    platforms: config.platforms,
    base_image: baseImage,
    default_node_major: defaultNodeMajor,
    node_majors: supportedNodeMajors.join(','),
    node_lines: nodeLinesPlan,
    stacks: config.stacks,
    extensions: withComponentVersions(config.extensions, 'extension.toml'),
    buildpacks: withComponentVersions(config.buildpacks, 'buildpack.toml'),
    buildpack_group: withComponentVersions([config.buildpackGroup], 'buildpack.toml')[0],
    scan_matrix: scanMatrix(config, nodeLinesPlan),
  }
}

export function releaseEligibility(options = {}) {
  const config = loadConfig(options.config)
  const actor = options.actor || process.env.GITHUB_ACTOR || ''
  const before = options.before || ''
  const sha = options.sha || process.env.GITHUB_SHA || 'HEAD'

  let changedFiles = options.changedFiles ? parseList(options.changedFiles) : []
  if (before) {
    changedFiles = changedFilesForPush(before, sha)
  }

  let releaseEnabled = true
  let reason = 'releasable-change'
  if (actor === 'atlantis-terraformer-bot[bot]') {
    const workflowOnly = changedFiles.length > 0 && changedFiles.every((file) => config.workflowOnlyPaths.includes(file))
    if (workflowOnly) {
      releaseEnabled = false
      reason = 'terraform-managed-workflow-only-change'
    }
  }

  return {
    release_enabled: releaseEnabled,
    reason,
    changed_files: changedFiles,
    non_workflow_changes: changedFiles.filter((file) => !config.workflowOnlyPaths.includes(file)),
  }
}

export function componentStatus(options = {}) {
  const directory = requireOption(options.directory, '--directory')
  const imageRepository = requireOption(options.imageRepository, '--image-repository')
  const versionFile = options.versionFile || `${directory}/${options.kind === 'extension' ? 'extension.toml' : 'buildpack.toml'}`
  const version = readTomlValue(versionFile, 'version')
  const image = `${imageRepository}:${version}`
  const before = options.before || ''

  let changed = true
  let previousVersion = null
  if (before && !isZeroSha(before) && gitCanRead(`${before}:${versionFile}`)) {
    previousVersion = readTomlValueFromText(gitOutput(['show', `${before}:${versionFile}`]), 'version')
    changed = previousVersion !== version
  } else if (before && isZeroSha(before)) {
    changed = true
  }

  if (!changed && options.checkRemote) {
    changed = !imageExists(image)
  }

  return {
    directory,
    image_repository: imageRepository,
    image,
    version,
    previous_version: previousVersion,
    changed,
  }
}

export function renderBuilderConfig(options = {}) {
  const config = loadConfig(options.config)
  const imagePrefix = options.imagePrefix || config.imagePrefix
  const releaseTag = requireOption(options.releaseTag, '--release-tag')
  const source = options.source || config.builderConfig
  const output = requireOption(options.output, '--output')
  const sourceText = readText(source)
  const rendered = sourceText
    .replaceAll(`${imagePrefix}/stack-node:build`, `${imagePrefix}/stack-node:build-${releaseTag}`)
    .replaceAll(`${imagePrefix}/stack-node:run`, `${imagePrefix}/stack-node:run-${releaseTag}`)

  writeFileSync(resolve(rootDir, output), rendered)

  return {
    source,
    output,
    release_tag: releaseTag,
  }
}

export function trivyMetadata(options = {}) {
  const config = loadConfig(options.config)
  const imageKind = requireOption(options.imageKind, '--image-kind')
  const nodeMajor = requireOption(options.nodeMajor, '--node-major')
  const platform = requireOption(options.platform, '--platform')
  const releaseTag = requireOption(options.releaseTag, '--release-tag')
  const imagePrefix = options.imagePrefix || config.imagePrefix
  const platformId = platform.replace(/[/:]/g, '-')
  const image = imageRefForKind(imagePrefix, imageKind, releaseTag)

  return {
    image,
    sarif: `trivy-${imageKind}-${releaseTag}-${platformId}.sarif`,
    category: `container/${imageKind}/${nodeMajor}/${platformId}`,
    config: {
      image: {
        platform,
        source: ['remote'],
      },
    },
  }
}

export function trivyConfig(options = {}) {
  const platform = requireOption(options.platform, '--platform')
  const output = requireOption(options.output, '--output')
  const text = `image:\n  platform: ${platform}\n  source:\n    - remote\n`
  writeFileSync(resolve(rootDir, output), text)

  return {
    output,
    platform,
  }
}

export function promotionPlan(options = {}) {
  const config = loadConfig(options.config)
  const imagePrefix = options.imagePrefix || config.imagePrefix
  const nodeMajor = requireOption(options.nodeMajor, '--node-major')
  const releaseTag = requireOption(options.releaseTag, '--release-tag')
  const defaultNodeMajor = options.defaultNodeMajor || releasePlan(options).default_node_major
  const buildpackVersion = readTomlValue(`${config.buildpackGroup.directory}/buildpack.toml`, 'version')

  const stackTags = ['base', 'build', 'run'].map((stackTag) => {
    const tags = [`${imagePrefix}/stack-node:${stackTag}-${nodeMajor}`]
    if (nodeMajor === defaultNodeMajor) {
      tags.push(`${imagePrefix}/stack-node:${stackTag}`)
    }

    return {
      source: `${imagePrefix}/stack-node:${stackTag}-${releaseTag}`,
      tags,
    }
  })

  return {
    node_major: nodeMajor,
    default_node_major: defaultNodeMajor,
    release_tag: releaseTag,
    manifests: [
      ...stackTags,
      {
        source: `${imagePrefix}/builder-base:${releaseTag}`,
        tags: [`${imagePrefix}/builder-base:${nodeMajor}`],
      },
      {
        source: `${imagePrefix}/buildpack-yarn-workspace:${buildpackVersion}`,
        tags: [`${imagePrefix}/buildpack-yarn-workspace:${nodeMajor}`],
      },
    ],
  }
}

export function scanMatrix(config, nodeLines) {
  const rows = []
  for (const nodeLine of nodeLines) {
    for (const platform of config.platforms) {
      for (const imageKind of config.scanImageKinds) {
        rows.push({
          node_major: nodeLine.node_major,
          release_tag: nodeLine.release_tag,
          platform,
          image_kind: imageKind,
        })
      }
    }
  }

  return rows
}

function withComponentVersions(components, versionFile) {
  return components.map((component) => {
    const version = readTomlValue(`${component.directory}/${versionFile}`, 'version')

    return {
      ...component,
      version,
      image: `${component.imageRepository}:${version}`,
    }
  })
}

function changedFilesForPush(before, sha) {
  if (isZeroSha(before) || !gitCanRead(`${before}^{commit}`)) {
    return gitOutput(['diff-tree', '--no-commit-id', '--name-only', '-r', sha]).split('\n').filter(Boolean)
  }

  return gitOutput(['diff', '--name-only', before, sha]).split('\n').filter(Boolean)
}

function manifestVerify(options = {}) {
  const image = requireOption(options.image, '--image')
  const platforms = parseList(options.platforms || loadConfig(options.config).platforms.join(','))
  const inspect = commandOutput('docker', ['buildx', 'imagetools', 'inspect', image])
  const missing = platforms.filter((platform) => !inspect.includes(platform))
  if (missing.length > 0) {
    throw new Error(`${image} manifest is missing platforms: ${missing.join(', ')}`)
  }

  return {
    image,
    platforms,
  }
}

function nodeVerify(options = {}) {
  const image = requireOption(options.image, '--image')
  const platform = requireOption(options.platform, '--platform')
  const expectedNodeMajor = requireOption(options.expectedNodeMajor, '--expected-node-major')
  const entrypoint = options.entrypoint
  const command = parseList(options.command || 'node --version', ' ')
  const args = ['run', '--rm', '--pull', 'always', '--platform', platform]
  if (entrypoint) {
    args.push('--entrypoint', entrypoint)
  }
  args.push(image, ...command)

  const version = commandOutput('docker', args).trim()
  if (!version.startsWith(`v${expectedNodeMajor}.`)) {
    throw new Error(`${image} reported ${version}; expected Node.js ${expectedNodeMajor}`)
  }

  return {
    image,
    platform,
    version,
  }
}

function promote(options = {}) {
  const plan = promotionPlan(options)
  const commands = plan.manifests.map((manifest) => [
    'buildx',
    'imagetools',
    'create',
    ...manifest.tags.flatMap((tag) => ['--tag', tag]),
    manifest.source,
  ])

  if (options.execute) {
    for (const args of commands) {
      runCommand('docker', args)
    }
  }

  return {
    executed: Boolean(options.execute),
    commands: commands.map((args) => ['docker', ...args]),
  }
}

function prepareBuildpack(options = {}) {
  const directory = requireOption(options.directory, '--directory')
  const stageDir = requireOption(options.stageDir, '--stage-dir')
  const packageConfig = requireOption(options.packageConfig, '--package-config')
  runCommand('bash', ['scripts/prepare-buildpack-package.sh', directory, stageDir, packageConfig])

  return {
    directory,
    stage_dir: stageDir,
    config: packageConfig,
  }
}

function verifyBuildpackPackage(options = {}) {
  const archive = requireOption(options.archive, '--archive')
  const directory = requireOption(options.directory, '--directory')
  runCommand('bash', ['scripts/verify-buildpack-package.sh', archive, directory])

  return {
    archive,
    directory,
  }
}

function localCheck(options = {}) {
  const plan = releasePlan(options)
  const tempDir = mkdtempSync(resolve(tmpdir(), 'buildpacks-ghcr-release-'))
  const builderConfig = `${tempDir}/builder.toml`
  try {
    renderBuilderConfig({
      ...options,
      releaseTag: plan.node_lines[0].release_tag,
      output: builderConfig,
    })
    const metadata = trivyMetadata({
      ...options,
      imageKind: 'stack-node-base',
      nodeMajor: plan.node_lines[0].node_major,
      platform: plan.platforms[0],
      releaseTag: plan.node_lines[0].release_tag,
    })
    const promotion = promotionPlan({
      ...options,
      nodeMajor: plan.node_lines[0].node_major,
      releaseTag: plan.node_lines[0].release_tag,
      defaultNodeMajor: plan.default_node_major,
    })

    return {
      plan: {
        default_node_major: plan.default_node_major,
        node_lines: plan.node_lines,
        scan_rows: plan.scan_matrix.length,
      },
      builder_config: builderConfig,
      trivy: metadata,
      promotion,
    }
  } finally {
    if (!options.keepTemp) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  }
}

function parseArgs(argv) {
  const command = argv[2]
  const options = {}
  const rest = argv.slice(3)

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index]
    if (arg === '--json') {
      options.json = true
    } else if (arg === '--check-remote') {
      options.checkRemote = true
    } else if (arg === '--execute') {
      options.execute = true
    } else if (arg === '--keep-temp') {
      options.keepTemp = true
    } else if (arg.startsWith('--')) {
      const key = optionKey(arg)
      const value = rest[index + 1]
      if (value === undefined || value.startsWith('--')) {
        throw new Error(`Missing value for ${arg}`)
      }
      options[key] = value
      index += 1
    } else {
      throw new Error(`Unexpected argument: ${arg}`)
    }
  }

  return { command, options }
}

function optionKey(arg) {
  return arg
    .slice(2)
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

function writeOutputs(result, outputPath) {
  if (!outputPath) {
    return
  }

  const lines = []
  for (const [key, value] of Object.entries(result)) {
    if (['string', 'number', 'boolean'].includes(typeof value)) {
      lines.push(`${key}=${value}`)
    } else if (Array.isArray(value) || (value && typeof value === 'object')) {
      lines.push(`${key}=${JSON.stringify(value)}`)
    }
  }
  if (lines.length > 0) {
    writeFileSync(outputPath, `${lines.join('\n')}\n`, { flag: 'a' })
  }
}

function printJson(result) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
}

function readJson(path) {
  return JSON.parse(readText(path))
}

function readText(path) {
  return readFileSync(resolve(rootDir, path), 'utf8')
}

function readDockerfileArg(path, name) {
  const text = readText(path)
  const match = text.match(new RegExp(`^ARG\\s+${escapeRegExp(name)}=(.+)$`, 'm'))
  if (!match) {
    throw new Error(`Missing ARG ${name} in ${path}`)
  }

  return match[1].trim()
}

function readTomlValue(path, key) {
  return readTomlValueFromText(readText(path), key, path)
}

function readTomlValueFromText(text, key, path = 'toml input') {
  const match = text.match(new RegExp(`^${escapeRegExp(key)}\\s*=\\s*"?([^"\\n]+)"?\\s*$`, 'm'))
  if (!match) {
    throw new Error(`Missing ${key} in ${path}`)
  }

  return match[1].trim()
}

function normalizeMajor(value, label) {
  const normalized = String(value).trim()
  if (!/^[0-9]+$/.test(normalized)) {
    throw new Error(`Unsupported ${label}: ${value}`)
  }

  return normalized
}

function imageRefForKind(imagePrefix, imageKind, releaseTag) {
  if (imageKind === 'builder-base') {
    return `${imagePrefix}/builder-base:${releaseTag}`
  }
  if (imageKind === 'stack-node-base') {
    return `${imagePrefix}/stack-node:base-${releaseTag}`
  }
  if (imageKind === 'stack-node-build') {
    return `${imagePrefix}/stack-node:build-${releaseTag}`
  }
  if (imageKind === 'stack-node-run') {
    return `${imagePrefix}/stack-node:run-${releaseTag}`
  }

  throw new Error(`Unsupported image kind: ${imageKind}`)
}

function imageExists(image) {
  const result = spawnSync('docker', ['buildx', 'imagetools', 'inspect', image], {
    cwd: rootDir,
    encoding: 'utf8',
  })

  return result.status === 0
}

function gitCanRead(revision) {
  const result = spawnSync('git', ['cat-file', '-e', revision], {
    cwd: rootDir,
    encoding: 'utf8',
  })

  return result.status === 0
}

function gitOutput(args) {
  return commandOutput('git', args)
}

function commandOutput(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
  })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${result.stderr || result.stdout}`)
  }

  return result.stdout.trim()
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed`)
  }
}

function parseList(value, separator = ',') {
  return value.split(separator).map((entry) => entry.trim()).filter(Boolean)
}

function requireOption(value, name) {
  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

function shortSha(sha) {
  return sha.trim().slice(0, 12)
}

function isZeroSha(sha) {
  return /^0+$/.test(sha)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function main() {
  const { command, options } = parseArgs(process.argv)
  if (!command || command === 'help' || command === '--help') {
    process.stdout.write(`${usage}\n`)
    return
  }

  const commands = {
    plan: releasePlan,
    eligibility: releaseEligibility,
    'component-status': componentStatus,
    'prepare-buildpack': prepareBuildpack,
    'verify-buildpack-package': verifyBuildpackPackage,
    'builder-config': renderBuilderConfig,
    'manifest-verify': manifestVerify,
    'node-verify': nodeVerify,
    'trivy-metadata': trivyMetadata,
    'trivy-config': trivyConfig,
    'promotion-plan': promotionPlan,
    promote,
    check: localCheck,
  }

  const handler = commands[command]
  if (!handler) {
    throw new Error(`Unknown command: ${command}\n${usage}`)
  }

  const result = handler(options)
  writeOutputs(result, options.githubOutput || process.env.GITHUB_OUTPUT)
  printJson(result)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`)
    process.exit(1)
  })
}
