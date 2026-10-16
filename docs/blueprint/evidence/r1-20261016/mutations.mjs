// Run from any directory: node docs/blueprint/evidence/r1-20261016/mutations.mjs
// Mutate bundled source / CSS reads only. Never edit the working sources or frozen coss files.
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';

const evidence = fileURLToPath(new URL('.', import.meta.url));
const root = path.resolve(evidence, '../../../..');
const testSource = readFileSync(path.join(root, 'tests/agent-blueprint-r1.test.mjs'), 'utf8');
const baseline = '5644554aa6920fdbffdcbd1fdac617c20af1cc2e';
const prompt = 'components/prism-next/agent-prompt-bar.tsx';
const css = 'app/(next)/next/blueprint.css';
const current = p => readFileSync(path.join(root, p), 'utf8');
const cases = [
  { id: 'CI-01-rollback', path: prompt, replacement: execFileSync('git', ['show', `${baseline}:${prompt}`], { cwd: root, encoding: 'utf8' }) },
  { id: 'CI-01-default-hidden', path: prompt, replacement: current(prompt).replace('showModelSelector = true', 'showModelSelector = false') },
  { id: 'CI-01-stale-open', path: prompt, replacement: current(prompt).replace('if (!showModelSelector) setModelOpen(false)', '/* removed reset */') },
  { id: 'CI-07-approval-copy', path: 'components/prism-next/agent-components.tsx', replacement: current('components/prism-next/agent-components.tsx').replace('补充一个信息', '需要你确认') },
  { id: 'CI-08-drop-attachment-hook', path: 'components/prism-next/agent-message.tsx', replacement: current('components/prism-next/agent-message.tsx').replace('data-slot="agent-message-attachment" ', '') },
  { id: 'CI-08-drop-radius', path: css, replacement: current(css).split('\n').filter(line => !line.includes(':where([data-agent-message="user"],[data-slot="agent-message-attachment"])')).join('\n') },
  { id: 'CI-09-drop-button-reset', path: css, replacement: current(css).split('\n').filter(line => !line.startsWith('[data-prism-theme="blueprint"] :where([data-agent-prompt-bar]')).join('\n') },
  { id: 'CI-09-drop-ink-outline', path: css, replacement: current(css).split('\n').filter(line => !line.startsWith('[data-prism-theme="blueprint"] [data-agent-message="user"]')).join('\n') },
  { id: 'CI-08-09-preview-leak', path: css, replacement: current(css).split('\n').map(line => /data-agent-(?:message|prompt-bar|surface)|agent-message-attachment/.test(line) ? line.replace(/:not\(:where\(\[data-agent-preview\].*? \*\)\)/g, '') : line).join('\n') },
  ...['menu', 'popover', 'select', 'dialog', 'tooltip'].map(name => {
    const file = `components/coss/${name}.tsx`;
    return { id: `CI-11-drop-${name}-forwarding`, path: file, replacement: current(file).replace('{...portalProps}', '') };
  }),
  { id: 'CI-11-drop-prompt-containers', path: prompt, replacement: current(prompt).replaceAll('portalProps={{ container: root }}', 'portalProps={{}}') },
];
const results = [], logs = [];
for (const mutation of cases) {
  if (mutation.replacement === current(mutation.path)) throw new Error(`No-op mutant: ${mutation.id}`);
  const prelude = `
const mutationPath = ${JSON.stringify(mutation.path)};
const mutationText = ${JSON.stringify(mutation.replacement)};
const mutateSource = (file, source) => file.replaceAll('\\\\', '/').endsWith('/' + mutationPath) ? mutationText : source;
const mutationPlugin = { name: 'p73-in-memory-mutation', setup(b) { b.onLoad({filter: /\\.tsx$/}, args => args.path.replaceAll('\\\\', '/').endsWith('/' + mutationPath) ? {loader:'tsx', contents:mutationText} : undefined); } };
`;
  const source = prelude + testSource
    .replace("from './helpers/test-runtime.mjs'", "from '../tests/helpers/test-runtime.mjs'")
    .replace("const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');", "const read = path => mutateSource('/' + path, readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));")
    .replace('write: false, plugins });', 'write: false, plugins: [...plugins, mutationPlugin] });')
    .replace("readFileSync(args.path, 'utf8').replace(", "mutateSource(args.path, readFileSync(args.path, 'utf8')).replace(");
  const file = path.join(root, '.sites-runtime', `p73-mutation-${process.pid}.test.mjs`);
  try {
    writeFileSync(file, source);
    const run = spawnSync(process.execPath, ['--test', '--test-reporter=tap', file], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    const output = run.stdout + run.stderr;
    const failing = [...output.matchAll(/^not ok \d+ - (.+)$/gm)].map(m => m[1]);
    const total = Number(output.match(/^# tests (\d+)$/m)?.[1] ?? 0);
    const caught = run.status === 1 && total === 11 && failing.length > 0;
    results.push({ id: mutation.id, source: mutation.path, exitCode: run.status, tests: total, detected: caught, failing });
    logs.push(`${mutation.id}\n${output.split('\n').filter(line => /^(ok |not ok |# (tests|pass|fail|cancelled|skipped))/.test(line)).join('\n')}\n`);
  } finally { unlinkSync(file); }
}
writeFileSync(path.join(evidence, 'mutations.json'), JSON.stringify({ baseline, method: 'in-memory esbuild source replacement and CSS read replacement; working files unchanged', total: results.length, detected: results.filter(r => r.detected).length, results }, null, 2) + '\n');
writeFileSync(path.join(evidence, 'mutations.log'), logs.join('\n'));
console.log(`${results.filter(r => r.detected).length}/${results.length} mutants detected`);
if (results.some(r => !r.detected)) process.exitCode = 1;

// Exercise the existing night-boundary test changed for the authorized white-only
// focus rules, without weakening its older shared/night assertions.
const boundarySource = readFileSync(path.join(root, 'tests/blueprint-night.test.mjs'), 'utf8');
const whiteGuard = ':not(:where([data-agent-preview][data-prism-theme]:not([data-prism-theme="blueprint"]), [data-agent-preview][data-prism-theme]:not([data-prism-theme="blueprint"]) *))';
const boundaryCases = [
  { id: 'existing-boundary-drop-white-guard', css: current(css).replaceAll(whiteGuard, '') },
  { id: 'existing-boundary-wrong-white-root', css: current(css).replaceAll('[data-prism-theme="blueprint"] :where([data-agent-prompt-bar]', '[data-prism-theme="blueprint-night"] :where([data-agent-prompt-bar]') },
];
const boundaryResults = [];
for (const mutation of boundaryCases) {
  const source = boundarySource.replace("from './helpers/test-runtime.mjs'", "from '../tests/helpers/test-runtime.mjs'")
    .replace("from './p57-chart-harness.mjs'", "from '../tests/p57-chart-harness.mjs'")
    .replace("const bp = postcss.parse(read('app/(next)/next/blueprint.css'));", `const bp = postcss.parse(${JSON.stringify(mutation.css)});`);
  const file = path.join(root, '.sites-runtime', `p73-boundary-mutation-${process.pid}.test.mjs`);
  try {
    writeFileSync(file, source);
    const run = spawnSync(process.execPath, ['--test', '--test-reporter=tap', '--test-name-pattern=shared, white-only', file], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    const output = run.stdout + run.stderr;
    const failing = [...output.matchAll(/^not ok \d+ - (.+)$/gm)].map(m => m[1]);
    boundaryResults.push({ id: mutation.id, exitCode: run.status, detected: run.status === 1 && failing.some(name => name.startsWith('shared, white-only')), failing });
  } finally { unlinkSync(file); }
}
writeFileSync(path.join(evidence, 'boundary-test-mutations.json'), JSON.stringify({ method: 'replace only the in-memory parsed CSS in a temporary copy of the existing boundary test', total: boundaryResults.length, detected: boundaryResults.filter(r => r.detected).length, results: boundaryResults }, null, 2) + '\n');
console.log(`${boundaryResults.filter(r => r.detected).length}/${boundaryResults.length} existing-boundary-test mutants detected`);
if (boundaryResults.some(r => !r.detected)) process.exitCode = 1;
