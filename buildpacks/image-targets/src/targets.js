import { hasStart } from '../../yarn-workspace-start/src/eligibility.js'

export const resolveImageTargets = ({
  workspaces,
  changedLocations,
  explicitLocations,
  manifests,
}) => {
  const allMode = explicitLocations !== undefined
  const selected = new Set(allMode ? explicitLocations : changedLocations)

  if (!allMode && selected.has('.')) {
    for (const { location } of workspaces) {
      selected.add(location)
    }
  }

  if (!allMode) {
    for (let previousSize = -1; previousSize !== selected.size;) {
      previousSize = selected.size

      for (const workspace of workspaces) {
        if (workspace.workspaceDependencies?.some((location) => selected.has(location))) {
          selected.add(workspace.location)
        }
      }
    }
  }

  const targets = workspaces
    .filter((workspace) => selected.has(workspace.location))
    .flatMap((workspace) => {
      const manifest = manifests.get(workspace.location)

      if (!manifest?.name || !hasStart(manifest.scripts?.start)) {
        return []
      }

      return [
        {
          workspace: manifest.name,
          imageName: manifest.name.replace(/^@/, '').replaceAll('/', '-'),
        },
      ]
    })
    .sort((left, right) => left.workspace.localeCompare(right.workspace))

  if (targets.length === 0) {
    throw new Error('No eligible image workspaces')
  }

  const imageNames = new Set()

  for (const target of targets) {
    if (imageNames.has(target.imageName)) {
      throw new Error(`Image repository name collision: ${target.imageName}`)
    }

    imageNames.add(target.imageName)
  }

  return targets
}
