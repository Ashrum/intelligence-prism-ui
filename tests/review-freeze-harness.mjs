import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
export const normalizeReview = html => html.replace(/«[^»]*»|_R_[^\s"<>]*_/g, 'REACT_ID');
const root = fileURLToPath(new URL('../', import.meta.url));
export async function freezeRenderer() {
  const file = new URL('../.sites-runtime/c1-freeze/probe.mjs', import.meta.url);
  await mkdir(new URL('.', file), { recursive: true });
  const compiled = await build({ stdin: { contents: `export { PaperReviewDesign } from './examples/paper-review/paper-review';`, resolveDir: root, loader: 'tsx' }, bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' }, write: false, plugins: [{ name: 'freeze-states', setup(b) {
    b.onLoad({ filter: /examples\/paper-review\/paper-review\.tsx$/ }, async args => {
      let source = (await readFile(args.path, 'utf8')).replace('import { ReviewTools } from "@/examples/review-tools/review-tools"', 'const ReviewTools = () => null');
      for (const [name, initial] of [['selected', "'q17'"], ['missing','false'], ['mode',"'marked'"], ['immersive','false'], ['studentOpen','false']]) {
        const pattern = new RegExp(`(\\[${name}, [^\\]]+\\] = useState)\\(${initial}\\)`);
        source = source.replace(pattern, `$1((globalThis as any).__freezeState?.${name} ?? ${initial})`);
      }
      source = source.replace('preferences: {}, ready: false, animate: false', 'preferences: (globalThis as any).__freezeState?.preferences ?? {}, ready: false, animate: false');
      return { loader: 'tsx', contents: source };
    });
    // SSR portals have no body. Inline only the portal surface for the open-panel
    // case so its real coss input, filtering, groups, rows and marker are frozen too.
    b.onLoad({ filter: /components\/coss\/combobox\.tsx$/ }, async args => ({ loader: 'tsx', contents: (await readFile(args.path, 'utf8')).replace('export function ComboboxPopup({', 'function OriginalComboboxPopup({') + '\nexport function ComboboxPopup(props: any) { return (globalThis as any).__freezeState?.studentOpen ? <div data-freeze-popup className={props.className} aria-label={props["aria-label"]}>{props.children}</div> : <OriginalComboboxPopup {...props} /> }' }));
  } }] });
  await writeFile(file, compiled.outputFiles[0].text);
  const api = await import(file);
  return { review(state = {}) { globalThis.__freezeState = state; const html = normalizeReview(renderToStaticMarkup(React.createElement(api.PaperReviewDesign))); delete globalThis.__freezeState; return html; } };
}
export const freezeStates = { default: {}, collapsed: { preferences: { best: true } }, immersive: { immersive: true }, original: { mode: 'original' }, missing: { missing: true }, question8: { selected: 'q8' }, studentOpen: { studentOpen: true } };
