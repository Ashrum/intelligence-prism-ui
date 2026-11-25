import { readFileSync } from "node:fs";
import { posix } from "node:path";

const uiPath = "packages/ui";
const readJson = (path) =>
  JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
const manifest = readJson(`${uiPath}/package.json`);
const lockfile = readJson("package-lock.json");

if (lockfile.lockfileVersion !== 3 || !lockfile.packages?.[uiPath]) {
  throw new Error("Expected an npm v3 workspace lockfile containing packages/ui.");
}

const packages = lockfile.packages;
const blocked = /^(?:@radix-ui\/[^/]+|radix-ui|vaul|sonner)$/;
const issues = new Set();
const visited = new Set();

function inspectName(name, origin) {
  if (blocked.test(name)) issues.add(`${origin} uses ${name}`);
}

function resolveDependency(from, name) {
  let directory = from;
  while (directory !== ".") {
    if (posix.basename(directory) !== "node_modules") {
      const candidate = `${directory}/node_modules/${name}`;
      if (Object.hasOwn(packages, candidate)) return candidate;
    }
    directory = posix.dirname(directory);
  }
  const hoisted = `node_modules/${name}`;
  return Object.hasOwn(packages, hoisted) ? hoisted : undefined;
}

function inspectDependencies(origin, entry, includeDev = false) {
  const groups = ["dependencies", "optionalDependencies", "peerDependencies"];
  if (includeDev) groups.push("devDependencies");

  for (const group of groups) {
    for (const [name, specifier] of Object.entries(entry[group] ?? {})) {
      inspectName(name, origin);
      const alias = specifier.match(/^npm:((?:@[^/]+\/)?[^@]+)(?:@|$)/)?.[1];
      if (alias) inspectName(alias, origin);

      const target = resolveDependency(origin, name);
      if (target) {
        inspectPackage(target);
      } else if (
        group !== "optionalDependencies" &&
        !Object.hasOwn(entry.optionalDependencies ?? {}, name) &&
        !entry.peerDependenciesMeta?.[name]?.optional
      ) {
        issues.add(`${origin} cannot resolve ${name} in package-lock.json`);
      }
    }
  }

  const bundled = entry.bundleDependencies ?? entry.bundledDependencies;
  if (Array.isArray(bundled)) {
    for (const name of bundled) inspectName(name, origin);
  }
}

function inspectPackage(path) {
  if (visited.has(path)) return;
  visited.add(path);
  const entry = packages[path];
  if (!entry) {
    issues.add(`Missing package-lock.json entry for ${path}`);
    return;
  }

  const name = path.split("node_modules/").at(-1);
  inspectName(entry.name ?? name, path);
  if (entry.link) {
    inspectPackage(entry.resolved);
  } else {
    inspectDependencies(path, entry, path === uiPath);
  }
}

inspectPackage(uiPath);
inspectDependencies(uiPath, manifest, true);

if (issues.size) {
  console.error(`[no-radix] Failed:\n- ${[...issues].sort().join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`[no-radix] @ole/ui and ${visited.size - 1} reachable lockfile entries contain 0 forbidden dependencies.`);
}
