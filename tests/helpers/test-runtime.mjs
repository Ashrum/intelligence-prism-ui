import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { after } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sep } from 'node:path';

// Keep bundles under the repository so external packages resolve from node_modules.
// Each harness instance owns a unique directory, including across test processes.
export async function createTestRuntime(name) {
  const root = new URL('../../.sites-runtime/', import.meta.url);
  await mkdir(root, { recursive: true });
  const directory = await mkdtemp(fileURLToPath(new URL(`${name}-${process.pid}-`, root)));
  after(() => rm(directory, { recursive: true, force: true }));
  return pathToFileURL(directory + sep);
}
