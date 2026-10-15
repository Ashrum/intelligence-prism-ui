// Read-only platform probe. Does not replace application sources or test hooks.
import { build } from 'esbuild';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const baseline = resolve(root, '.sites-runtime/baseline-head-1f575ea-windows');
const hash = value => createHash('sha256').update(value).digest('hex');
const read = path => readFileSync(resolve(root, path), 'utf8');
const gitShow = path => execFileSync('git', ['show', `HEAD:${path}`], { cwd: root, encoding: 'utf8' });
const paths = [];
await build({
  absWorkingDir: root,
  entryPoints: ['components/prism-next/stepper.tsx', 'components/prism-next/charts/echart.tsx'],
  bundle: true, write: false, outdir: '.sites-runtime/read-only-probe',
  platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' },
  plugins: [{ name: 'observe-native-paths', setup(b) {
    b.onLoad({ filter: /(?:stepper|echart)\.tsx$/ }, args => {
      const normalized = args.path.replaceAll('\\', '/');
      paths.push({
        path: args.path,
        stepperFilterMatches: /prism-next\/stepper\.tsx$/.test(args.path),
        stepperNormalizedMatches: /prism-next\/stepper\.tsx$/.test(normalized),
        chartFilterMatches: /\/charts\/echart\.tsx$/.test(args.path),
        chartNormalizedMatches: /\/charts\/echart\.tsx$/.test(normalized),
      });
      return undefined;
    });
  } }],
});
const css = read('components/prism-next/stepper.css');
const headCSS = gitShow('components/prism-next/stepper.css');
const cssPrefix = source => source.split('/* Optional horizontal toolbar')[0];
const originals = ['tests/stepper.test.mjs', 'tests/review-tools.test.mjs', 'components/prism-next/stepper.tsx', 'components/prism-next/stepper.css', 'examples/review-tools/review-tools.tsx'];
const baselineIntegrity = originals.map(path => {
  const actual = readFileSync(resolve(baseline, path));
  const head = Buffer.from(gitShow(path));
  return { path, sameBytesAsHEAD: actual.equals(head), sha256: hash(actual) };
});
console.log(JSON.stringify({
  node: process.version, platform: process.platform,
  baseline: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  baselineHasGitDirectory: existsSync(resolve(baseline, '.git')),
  paths,
  stepperCSS: {
    rawHasCRLF: css.includes('\r\n'), normalizedEqualHEAD: css.replaceAll('\r\n', '\n') === headCSS,
    rawPrefixSHA256: hash(cssPrefix(css)), normalizedPrefixSHA256: hash(cssPrefix(css.replaceAll('\r\n', '\n'))), headPrefixSHA256: hash(cssPrefix(headCSS)),
  },
  baselineIntegrity,
}, null, 2));
