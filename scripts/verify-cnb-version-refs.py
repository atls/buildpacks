#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import sys
import tomllib
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
IMAGE_PREFIX = "ghcr.io/atls"


@dataclass(frozen=True)
class Component:
    path: str
    identifier: str
    image: str
    version: str


def load_toml(path: str) -> dict:
    with (ROOT / path).open("rb") as file:
        return tomllib.load(file)


def load_json(path: str) -> dict:
    with (ROOT / path).open() as file:
        return json.load(file)


def buildpack_component(path: str, image: str) -> Component:
    config = load_toml(f"{path}/buildpack.toml")
    buildpack = config["buildpack"]
    return Component(
        path=path,
        identifier=buildpack["id"],
        image=image,
        version=buildpack["version"],
    )


def extension_component(path: str, image: str) -> Component:
    config = load_toml(f"{path}/extension.toml")
    extension = config["extension"]
    return Component(
        path=path,
        identifier=extension["id"],
        image=image,
        version=extension["version"],
    )


def expect(errors: list[str], actual: str | None, expected: str, subject: str) -> None:
    if actual != expected:
        errors.append(f"{subject}: expected {expected!r}, got {actual!r}")


def verify_release_please(
    errors: list[str],
    components: dict[str, Component],
) -> None:
    config = load_json("release-please-config.json")
    manifest = load_json(".release-please-manifest.json")
    packages = config.get("packages", {})

    expect(
        errors,
        str(config.get("include-v-in-tag")).lower(),
        "false",
        "release-please-config.json include-v-in-tag",
    )
    expect(
        errors,
        str(config.get("skip-changelog")).lower(),
        "true",
        "release-please-config.json skip-changelog",
    )
    bootstrap_sha = config.get("bootstrap-sha")
    if not isinstance(bootstrap_sha, str) or not re.fullmatch(r"[0-9a-f]{40}", bootstrap_sha):
        errors.append("release-please-config.json bootstrap-sha must be a 40-character git SHA")

    expect(
        errors,
        ",".join(sorted(packages)),
        ",".join(sorted(components)),
        "release-please-config.json packages",
    )
    expect(
        errors,
        ",".join(sorted(manifest)),
        ",".join(sorted(components)),
        ".release-please-manifest.json packages",
    )

    for path, component in components.items():
        expect(
            errors,
            manifest.get(path),
            component.version,
            f".release-please-manifest.json {path}",
        )

        package = packages.get(path, {})
        expected_file = "extension.toml" if path.startswith("extensions/") else "buildpack.toml"
        expected_jsonpath = "$.extension.version" if path.startswith("extensions/") else "$.buildpack.version"
        extra_files = package.get("extra-files", [])
        extra_file = extra_files[0] if len(extra_files) == 1 else {}

        expect(errors, package.get("release-type"), "simple", f"{path} release-type")
        expect(errors, package.get("component"), component.image, f"{path} component")
        expect(
            errors,
            str(package.get("include-component-in-tag")).lower(),
            "true",
            f"{path} include-component-in-tag",
        )
        expect(errors, extra_file.get("type"), "toml", f"{path} extra-files type")
        expect(errors, extra_file.get("path"), expected_file, f"{path} extra-files path")
        expect(errors, extra_file.get("jsonpath"), expected_jsonpath, f"{path} extra-files jsonpath")


def verify_yarn_workspace(
    errors: list[str],
    buildpacks: dict[str, Component],
) -> None:
    package_config = load_toml("buildpacks/yarn-workspace/package.toml")
    workspace_config = load_toml("buildpacks/yarn-workspace/buildpack.toml")

    dependencies = {
        dependency["uri"].removeprefix("docker://").rsplit(":", 1)[0]: dependency["uri"]
        for dependency in package_config.get("dependencies", [])
    }
    expected_dependencies = {
        f"{IMAGE_PREFIX}/{component.image}": f"docker://{IMAGE_PREFIX}/{component.image}:{component.version}"
        for component in buildpacks.values()
        if component.path != "buildpacks/yarn-workspace"
    }

    expect(
        errors,
        ",".join(sorted(dependencies)),
        ",".join(sorted(expected_dependencies)),
        "buildpacks/yarn-workspace/package.toml dependencies",
    )
    for repository, expected_uri in expected_dependencies.items():
        expect(
            errors,
            dependencies.get(repository),
            expected_uri,
            f"buildpacks/yarn-workspace/package.toml {repository}",
        )

    order_versions = {
        group["id"]: group.get("version")
        for order in workspace_config.get("order", [])
        for group in order.get("group", [])
    }
    expected_order = {
        component.identifier: component.version
        for component in buildpacks.values()
        if component.path != "buildpacks/yarn-workspace"
    }

    expect(
        errors,
        ",".join(sorted(order_versions)),
        ",".join(sorted(expected_order)),
        "buildpacks/yarn-workspace/buildpack.toml order group ids",
    )
    for identifier, expected_version in expected_order.items():
        expect(
            errors,
            order_versions.get(identifier),
            expected_version,
            f"buildpacks/yarn-workspace/buildpack.toml {identifier}",
        )


def verify_builder(
    errors: list[str],
    extensions: dict[str, Component],
) -> None:
    builder_config = load_toml("builders/base/builder.toml")
    actual_extensions = {extension["id"]: extension for extension in builder_config.get("extensions", [])}
    expected_extensions = {
        component.identifier: f"docker://{IMAGE_PREFIX}/{component.image}:{component.version}"
        for component in extensions.values()
    }

    expect(
        errors,
        ",".join(sorted(actual_extensions)),
        ",".join(sorted(expected_extensions)),
        "builders/base/builder.toml extension ids",
    )
    for identifier, expected_uri in expected_extensions.items():
        extension = actual_extensions.get(identifier, {})
        expect(errors, extension.get("uri"), expected_uri, f"builders/base/builder.toml {identifier}")


def verify_docker_release_workflow(
    errors: list[str],
    extensions: dict[str, Component],
) -> None:
    workflow = (ROOT / ".github/workflows/docker-release.yaml").read_text()
    found = {
        image: version
        for image, version in re.findall(
            rf"{re.escape(IMAGE_PREFIX)}/(buildpack-extension-[a-z-]+):([0-9]+\.[0-9]+\.[0-9]+)",
            workflow,
        )
    }
    expected = {component.image: component.version for component in extensions.values()}

    expect(
        errors,
        ",".join(sorted(found)),
        ",".join(sorted(expected)),
        ".github/workflows/docker-release.yaml extension images",
    )
    for image, expected_version in expected.items():
        expect(
            errors,
            found.get(image),
            expected_version,
            f".github/workflows/docker-release.yaml {image}",
        )


def main() -> int:
    errors: list[str] = []

    buildpacks = {
        "buildpacks/require-extension": buildpack_component(
            "buildpacks/require-extension",
            "buildpack-require-extension",
        ),
        "buildpacks/yarn-cache": buildpack_component(
            "buildpacks/yarn-cache",
            "buildpack-yarn-cache",
        ),
        "buildpacks/yarn-install": buildpack_component(
            "buildpacks/yarn-install",
            "buildpack-yarn-install",
        ),
        "buildpacks/yarn-workspace": buildpack_component(
            "buildpacks/yarn-workspace",
            "buildpack-yarn-workspace",
        ),
        "buildpacks/yarn-workspace-start": buildpack_component(
            "buildpacks/yarn-workspace-start",
            "buildpack-yarn-workspace-start",
        ),
    }
    extensions = {
        "extensions/curl": extension_component("extensions/curl", "buildpack-extension-curl"),
        "extensions/graphql-hive": extension_component(
            "extensions/graphql-hive",
            "buildpack-extension-graphql-hive",
        ),
        "extensions/htop": extension_component("extensions/htop", "buildpack-extension-htop"),
    }

    components = {**buildpacks, **extensions}

    verify_release_please(errors, components)
    verify_yarn_workspace(errors, buildpacks)
    verify_builder(errors, extensions)
    verify_docker_release_workflow(errors, extensions)

    if errors:
        print("CNB version reference check failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("CNB version reference check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
