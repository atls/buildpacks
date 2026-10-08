import assert from 'node:assert/strict'
import { test } from 'node:test'

import { resolveImageTargets } from '../src/targets.js'

const workspaces = [
  { location: '.', name: 'fixture', workspaceDependencies: [] },
  { location: 'packages/core', name: '@demo/core', workspaceDependencies: [] },
  { location: 'packages/api', name: '@demo/api', workspaceDependencies: ['packages/core'] },
  { location: 'packages/gateway', name: '@demo/gateway', workspaceDependencies: ['packages/api'] },
  { location: 'packages/site', name: '@demo/site', workspaceDependencies: [] },
  { location: 'packages/docs', name: '@demo/docs', workspaceDependencies: [] },
]

const manifests = new Map([
  ['.', { name: 'fixture' }],
  ['packages/core', { name: '@demo/core' }],
  ['packages/api', { name: '@demo/api', scripts: { start: 'node dist/api.js' } }],
  ['packages/gateway', { name: '@demo/gateway', scripts: { start: 'node dist/gateway.js' } }],
  ['packages/site', { name: '@demo/site', scripts: { start: 'node dist/site.js' } }],
  ['packages/docs', { name: '@demo/docs', scripts: { start: '   ' } }],
])

const select = (changedLocations, options = {}) =>
  resolveImageTargets({ workspaces, changedLocations, manifests, ...options })

test('changed library selects its runnable dependents transitively', () => {
  assert.deepEqual(select(['packages/core']), [
    { workspace: '@demo/api', imageName: 'demo-api' },
    { workspace: '@demo/gateway', imageName: 'demo-gateway' },
  ])
})

test('root change selects every runnable image workspace', () => {
  assert.deepEqual(select(['.']), [
    { workspace: '@demo/api', imageName: 'demo-api' },
    { workspace: '@demo/gateway', imageName: 'demo-gateway' },
    { workspace: '@demo/site', imageName: 'demo-site' },
  ])
})

test('explicit workspace selection uses Yarn-selected locations without change filtering', () => {
  assert.deepEqual(select([], { explicitLocations: ['packages/api'] }), [
    { workspace: '@demo/api', imageName: 'demo-api' },
  ])
  assert.deepEqual(select([], { explicitLocations: ['packages/gateway'] }), [
    { workspace: '@demo/gateway', imageName: 'demo-gateway' },
  ])
  assert.deepEqual(select([], { explicitLocations: ['packages/api', 'packages/site'] }), [
    { workspace: '@demo/api', imageName: 'demo-api' },
    { workspace: '@demo/site', imageName: 'demo-site' },
  ])
})

test('no runnable image workspace fails instead of reporting success', () => {
  assert.throws(() => select(['packages/docs']), /No eligible image workspaces/)
  assert.throws(() => select([]), /No eligible image workspaces/)
  assert.throws(() => select([], { explicitLocations: [] }), /No eligible image workspaces/)
})

test('conflicting image names fail before either image can be published', () => {
  const collidingWorkspaces = [
    { location: 'a', name: '@a/b-c', workspaceDependencies: [] },
    { location: 'b', name: '@a-b/c', workspaceDependencies: [] },
  ]
  const collidingManifests = new Map([
    ['a', { name: '@a/b-c', scripts: { start: 'node app.js' } }],
    ['b', { name: '@a-b/c', scripts: { start: 'node app.js' } }],
  ])

  assert.throws(
    () =>
      resolveImageTargets({
        workspaces: collidingWorkspaces,
        changedLocations: ['.'],
        manifests: collidingManifests,
      }),
    /Image repository name collision: a-b-c/
  )
})
