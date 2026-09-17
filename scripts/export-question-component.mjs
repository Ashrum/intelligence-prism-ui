import { build } from "esbuild";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const destination = process.argv[2];
if (!destination || !isAbsolute(destination) || !destination.endsWith(".html")) {
  throw new Error("Usage: node scripts/export-question-component.mjs /absolute/path/question-component.html");
}

const assets = join(root, "dist/client/assets");
let cssFiles;
try {
  cssFiles = (await readdir(assets)).filter(name => name.endsWith(".css")).sort();
} catch {
  throw new Error("Production CSS is missing. Run npm run build before exporting.");
}
if (!cssFiles.length) throw new Error("Production CSS is missing. Run npm run build before exporting.");

const [styles, font, fontLicense] = await Promise.all([
  Promise.all(cssFiles.map(name => readFile(join(assets, name), "utf8"))),
  readFile(join(root, "public/fonts/typography-review/stix-two-math.woff2")),
  readFile(join(root, "public/fonts/typography-review/STIX-OFL.txt"), "utf8"),
]);
let fontEmbedded = false;
const css = styles.join("\n").replace(/url\(\s*(['"]?)(.*?)\1\s*\)/g, (match, quote, url) => {
  if (url === "/fonts/typography-review/stix-two-math.woff2") {
    fontEmbedded = true;
    return `url("data:font/woff2;base64,${font.toString("base64")}")`;
  }
  if (/^(data:|#)/i.test(url)) return match;
  throw new Error(`Export requires an embedded CSS asset: ${url}`);
});
if (!fontEmbedded) throw new Error("The production CSS does not include the question math font.");
if (/@import\s|sourceMappingURL\s*=|<\/style/i.test(css)) {
  throw new Error("Production CSS contains an import, source map, or unexpected closing tag.");
}

const result = await build({
  absWorkingDir: root,
  stdin: {
    resolveDir: root,
    sourcefile: "question-export.tsx",
    loader: "tsx",
    contents: `
      import { useEffect, useState } from "react";
      import { createRoot } from "react-dom/client";
      import { QuestionComponentDemo } from "./components/prism-next/demos/question-component";
      import { QuestionSelect } from "./components/prism-next/question-controls";
      import { DESIGN_VERSION, themeOptions, type PrismTheme } from "./lib/prism-next/config";

      function QuestionExport() {
        const [theme, setTheme] = useState<PrismTheme>("light");
        useEffect(() => {
          document.documentElement.dataset.prismTheme = theme;
          document.body.dataset.prismTheme = theme;
        }, [theme]);
        return <main className="prism-root question-export-main" data-ui-version="coss-v1" data-prism-theme={theme}>
          <header className="question-export-heading">
            <div><h1>智能曜彩 · 题目组件</h1><p>v{DESIGN_VERSION}</p></div>
            <QuestionSelect label="主题" value={theme} onChange={value => setTheme(value as PrismTheme)} items={themeOptions.map(item => ({ ...item }))}/>
          </header>
          <QuestionComponentDemo standalone/>
        </main>;
      }
      createRoot(document.getElementById("question-component-root")!).render(<QuestionExport/>);
    `,
  },
  alias: { "@": root },
  bundle: true,
  write: false,
  platform: "browser",
  format: "iife",
  target: "es2020",
  define: { "process.env.NODE_ENV": '"production"' },
  minify: true,
  legalComments: "inline",
  metafile: true,
  logLevel: "silent",
});
for (const output of Object.values(result.metafile.outputs)) {
  if (output.imports.length) throw new Error("The question export still has external module imports.");
}
if (Object.keys(result.metafile.inputs).some(path => /(?:^|\/)node_modules\/(?:next|vinext)\//.test(path))) {
  throw new Error("The standalone question component must not include the site's router.");
}
if (result.outputFiles.length !== 1) throw new Error("The question export must contain exactly one JavaScript bundle.");

const script = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const escapeText = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const html = `<!doctype html>
<html lang="zh-CN" data-ui-version="coss-v1" data-prism-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; font-src data:; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'">
<title>智能曜彩 · 题目组件</title>
<style>${css}
.question-export-main{width:100%;margin-inline:auto;padding:2rem;min-width:0}
.question-export-heading{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem}
.question-export-heading h1{font-size:1.5rem;font-weight:600;line-height:1.4;color:var(--heading)}
.question-export-heading p{margin-top:.35rem;font-size:.875rem;color:var(--muted-foreground)}
@media(max-width:767px){.question-export-main{padding:1.25rem}}
</style>
</head>
<body data-ui-version="coss-v1" data-prism-theme="light">
<div id="question-component-root"></div>
<noscript>请启用 JavaScript 以查看题目和使用交互功能。</noscript>
<template id="stix-font-license">${escapeText(fontLicense)}</template>
<script>${script}</script>
</body>
</html>
`;
const resourceMarkup = html.replace(/<script>[\s\S]*?<\/script>/g, "").replace(/<style>[\s\S]*?<\/style>/g, "");
if (/<(?:script|iframe|img)\b[^>]*\bsrc\s*=|<link\b[^>]*\bhref\s*=/i.test(resourceMarkup)) {
  throw new Error("The exported HTML contains an external resource tag.");
}
await mkdir(dirname(destination), { recursive: true });
await writeFile(destination, html);
console.log(JSON.stringify({
  file: destination,
  bytes: Buffer.byteLength(html),
  javascriptBytes: Buffer.byteLength(script),
  cssBytes: Buffer.byteLength(css),
  embeddedFontBytes: font.byteLength,
  externalResources: 0,
}, null, 2));
