import assert            from 'node:assert/strict'
import { mkdtemp }       from 'node:fs/promises'
import { rm }            from 'node:fs/promises'
import { writeFile }     from 'node:fs/promises'
import { tmpdir }        from 'node:os'
import { join }          from 'node:path'
import { test }          from 'node:test'

import { BuildpackPlan } from '../buildpack-plan.js'

const createTempDir = async (): Promise<string> => mkdtemp(join(tmpdir(), 'libcnb-'))

test('BuildpackPlan parses plan.toml entries without leaking TOML payload shape', async () => {
  const rootDir = await createTempDir()
  const planPath = join(rootDir, 'plan.toml')

  try {
    await writeFile(
      planPath,
      ['[[entries]]', 'name = "node"', '', '[entries.metadata]', 'version = "26"', ''].join('\n')
    )

    const plan = await BuildpackPlan.fromPath(planPath)

    assert.equal(plan.entries[0].name, 'node')
    assert.deepEqual(plan.entries[0].metadata, {
      version: '26',
    })
  } finally {
    await rm(rootDir, { recursive: true, force: true })
  }
})
