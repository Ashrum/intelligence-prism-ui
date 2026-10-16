# Blueprint mono subset provenance

Geist Mono is sourced from the official [vercel/geist-font tag 1.4.2](https://github.com/vercel/geist-font/tree/1.4.2), pinned to commit `4d655731f83507f0258ce5541c297b6553d5d081`. The static Regular (400) and Medium (500) TTF files come from `packages/next/dist/fonts/geist-mono/` at that commit. The unchanged [OFL.txt](OFL.txt) accompanies the redistributed subsets.

These are actual fontTools subsets, not renamed full upstream WOFF2 files. Their character maps include printable ASCII, Latin-1 characters present upstream, and selected punctuation. `manifest.json` records source/output byte counts and SHA-256, actual codepoint ranges, glyph counts, tool versions and exact source URLs. The generated `blueprint-fonts.css` uses those actual ranges, `font-display: swap`, and the CSS-only family alias `Geist Mono Blueprint`; upstream font name and license records are retained.

Only explicit Blueprint chapter indices, folios, subsection codes, English component indices and figure labels use these fonts. Fallback is the existing `var(--font-mono)` stack. Chinese titles keep the UI font stack; ordinary controls, code blocks, mathematics and metrics are not changed. The chapter letter block uses the real 500 face; no synthetic 600/700 face is requested.

Reproduce with Python 3.12 and `fonttools==4.60.1`, `brotli==1.1.0` installed in an isolated environment, then run:

```sh
python scripts/subset-blueprint-mono.py
python scripts/subset-blueprint-mono.py --check
node scripts/check-blueprint-fonts.mjs
```

The Python script checks pinned source hashes before subsetting and downloads only into the ignored `.sites-runtime/editorial-20261016/upstream/` cache. `--check` rebuilds in memory and compares every generated file byte for byte. The generated CSS lives at `app/(next)/next/blueprint-fonts.css`; the two hosted WOFF2 files and license live beside this file. No npm dependency is required.
