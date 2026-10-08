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

  const eligible = workspaces.flatMap((workspace) => {
    const manifest = manifests.get(workspace.location)

    if (!manifest?.name || !hasStart(manifest.scripts?.start)) {
      return []
    }

    return [
      {
        location: workspace.location,
        workspace: manifest.name,
        imageName: manifest.name.replace(/^@/, '').replaceAll('/', '-'),
      },
    ]
  })

  const imageNames = new Set()

  for (const target of eligible) {
    if (imageNames.has(target.imageName)) {
      throw new Error(`Image repository name collision: ${target.imageName}`)
    }

    imageNames.add(target.imageName)
  }

  const targets = eligible
    .filter(({ location }) => selected.has(location))
    .map(({ workspace, imageName }) => ({ workspace, imageName }))
    .sort((left, right) => left.workspace.localeCompare(right.workspace))

  if (targets.length === 0) {
    throw new Error('No eligible image workspaces')
  }

  return targets
}
