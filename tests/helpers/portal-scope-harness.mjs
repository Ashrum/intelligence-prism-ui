import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createTestRuntime } from './test-runtime.mjs';
import { clientDOM } from './chart-client-dom.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const runtime = await createTestRuntime('portal-scope');
let serial = 0;
export async function compileScope(overrides = {}) {
  const output = await build({
    stdin: { contents: `export * from './components/prism-next/prism-scope';
      export * from './components/prism-next/scoped-overlays';
      export * from './components/prism-next/providers';
      export * from './components/prism-next/charts/chart-theme';
      export * from './components/prism-next/charts/echart';
      export * from './lib/prism-next/config';
      export * from './lib/prism-next/chart-palette';
      export { ToastPrimitive, toastManager } from './components/coss/toast';`, resolveDir: root, loader: 'tsx' },
    bundle: true, jsx: 'automatic', platform: 'node', format: 'esm', packages: 'external', alias: { '@': root }, write: false,
    plugins: [{ name: 'portal-transport-probe', setup(b) {
      b.onLoad({ filter: /\.(?:tsx|ts)$/ }, args => {
        const relative = args.path.slice(root.length);
        return Object.hasOwn(overrides, relative) ? { contents: overrides[relative], loader: args.path.endsWith('tsx') ? 'tsx' : 'ts' } : undefined;
      });
      b.onResolve({ filter: /^next-themes$|^motion\/react$|^@base-ui\/react\/(?:select|combobox|menu|dialog|popover|tooltip|drawer|toast)$/ }, args => ({ path: args.path, namespace: 'p74' }));
      b.onLoad({ filter: /.*/, namespace: 'p74' }, args => {
        if (args.path === 'next-themes') return { contents: 'export const useTheme=()=>({theme:globalThis.__p74GlobalTheme}); export const ThemeProvider=({children})=>children;' };
        if (args.path === 'motion/react') return { contents: 'export const MotionConfig=({children})=>children;' };
        const name = args.path.split('/').at(-1), cap = name[0].toUpperCase() + name.slice(1);
        return { loader: 'tsx', resolveDir: root, contents: `
          import React from 'react';
          import { FloatingPortal } from ${JSON.stringify(root + 'node_modules/@base-ui/react/floating-ui-react/components/FloatingPortal.mjs')};
          ${name === 'toast' ? `import { Toast as ActualToast } from ${JSON.stringify(root + 'node_modules/@base-ui/react/toast/index.mjs')};` : ''}
          const primitives = new Map();
          export const ${cap} = new Proxy(${name === 'toast' ? 'ActualToast' : '{}'}, {get(target,key) {
            // Toast keeps its real queue, Provider, hooks and Portal (FloatingPortalLite).
            if (${name === 'toast'} && ['Provider','createToastManager','useToastManager','Portal'].includes(key)) return target[key];
            if (key === 'Portal') return FloatingPortal;
            if (!primitives.has(key)) primitives.set(key, function Primitive(props) {
              (globalThis.__p74Primitives ??= []).push({kind:${JSON.stringify(name)} + '.' + String(key), props});
              return React.createElement('div', {'data-probe-primitive':String(key)}, props.children);
            });
            return primitives.get(key);
          }});
        ` };
      });
      b.onLoad({ filter: /\/charts\/echart-engine\.tsx?$/ }, () => ({ contents: 'export const init=()=>globalThis.__p74Engine;' }));
    } }],
  });
  const file = new URL(`scope-${serial++}.mjs`, runtime);
  writeFileSync(file, output.outputFiles[0].text);
  return import(file);
}

// Commit-only DOM: React + the installed Base UI Portal resolver really append/remove nodes.
// Store/positioning/focus primitives are probes, so this is not browser acceptance.
export function portalDOM() {
  const dom = clientDOM(1280, 720), Element = dom.window.HTMLElement;
  dom.window.Node = Element;
  dom.window.Element = Element;
  Element.prototype.hasAttribute = function (key) { return key in this.attributes; };
  Element.prototype.contains = function (node) { for (let n = node; n; n = n.parentNode) if (n === this) return true; return false; };
  Element.prototype.querySelectorAll = function () { return []; };
  Element.prototype.remove = function () { this.parentNode?.removeChild(this); };
  dom.document.documentElement.appendChild(dom.document.body);
  return dom;
}

export const read = path => readFileSync(root + path, 'utf8');
