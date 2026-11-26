import { existsSync, readFileSync, readdirSync } from "node:fs";
import { posix } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const uiPath = "packages/ui";
const readJson = (path) =>
  JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
const manifest = readJson(`${uiPath}/package.json`);
const lockfile = readJson("package-lock.json");

if (lockfile.lockfileVersion !== 3 || !lockfile.packages?.[uiPath]) {
  throw new Error("Expected an npm v3 workspace lockfile containing packages/ui.");
}

const packages = lockfile.packages;
const blocked = /^(?:@radix-ui\/[^/]+|radix-ui|@mui\/[^/]+|@emotion\/[^/]+|vaul|sonner)$/;
const issues = new Set();
const visited = new Set();
let distFiles = 0;
let sourceFiles = 0;

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
  inspectName(name, path);
  if (entry.name) inspectName(entry.name, path);
  if (entry.link) {
    inspectPackage(entry.resolved);
  } else {
    inspectDependencies(path, entry, !path.includes("node_modules/"));
  }
}

function inspectModuleFile(path) {
  const source = ts.createSourceFile(
    path, readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), ts.ScriptTarget.Latest, true,
  );

  function inspectSpecifier(specifier, position) {
    const parts = specifier.split("/");
    const name = parts.slice(0, specifier.startsWith("@") ? 2 : 1).join("/");
    if (blocked.test(name)) {
      const { line } = source.getLineAndCharacterOfPosition(position);
      issues.add(`${path}:${line + 1} uses ${specifier}`);
    }
  }

  function visit(node) {
    let specifier;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isJSDocImportTag(node)) {
      specifier = node.moduleSpecifier;
    } else if (ts.isExternalModuleReference(node)) {
      specifier = node.expression;
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      specifier = node.argument.literal;
    } else if (ts.isModuleDeclaration(node)) {
      specifier = node.name;
    } else if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (callee.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(callee) && callee.text === "require") ||
          (ts.isPropertyAccessExpression(callee) && callee.name.text === "resolve" &&
            ((ts.isIdentifier(callee.expression) && callee.expression.text === "require") ||
              (ts.isMetaProperty(callee.expression) && callee.expression.keywordToken === ts.SyntaxKind.ImportKeyword)))) {
        specifier = node.arguments[0];
      }
    }
    if (specifier && ts.isStringLiteralLike(specifier)) {
      inspectSpecifier(specifier.text, specifier.getStart(source));
    }
    node.jsDoc?.forEach(visit);
    ts.forEachChild(node, visit);
  }

  visit(source);
  for (const reference of source.typeReferenceDirectives) inspectSpecifier(reference.fileName, reference.pos);
}

function inspectModules(directory, pattern) {
  let count = 0;
  const absolute = fileURLToPath(new URL(`../${directory}`, import.meta.url));
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const path = posix.join(directory, entry.name);
    if (entry.isDirectory()) count += inspectModules(path, pattern);
    else if (entry.isFile() && pattern.test(entry.name)) {
      inspectModuleFile(path);
      count++;
    }
  }
  return count;
}

for (const path of Object.keys(packages)) inspectPackage(path);
inspectDependencies(uiPath, manifest, true);
for (const directory of [`${uiPath}/src`, "apps/gallery/src"]) {
  sourceFiles += inspectModules(directory, /\.[cm]?[jt]sx?$/);
}

const distDirectory = `${uiPath}/dist`;
if (process.argv.includes("--verify-dist") || existsSync(new URL(`../${distDirectory}`, import.meta.url))) {
  if (existsSync(new URL(`../${distDirectory}`, import.meta.url))) {
    distFiles = inspectModules(distDirectory, /(?:\.js|\.d\.ts)$/);
  }
  if (!distFiles) issues.add(`No JavaScript or declaration artifacts found in ${distDirectory}`);
}

if (issues.size) {
  console.error(`[no-radix] Failed:\n- ${[...issues].sort().join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log(`[no-radix] ${visited.size} workspace lockfile entries, ${sourceFiles} source files, and ${distFiles} build artifacts contain 0 forbidden dependencies.`);
}
