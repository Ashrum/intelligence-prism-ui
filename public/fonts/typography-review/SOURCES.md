# Typography review font sources

The isolated `/review/typography` page compares Regular (400) faces. The three Chinese WOFF2 files in this directory are **fixed-sample subsets**, not production character coverage. The site uses the separate, self-hosted full-source-cmap shards described below. The two mathematical fonts are complete and retain OpenType MATH data. The comparison's subset aliases remain isolated from the shared UI and reading fonts.

| File | Original family / version | Source | License |
| --- | --- | --- | --- |
| noto-sans-sc.woff2 | Noto Sans CJK SC / 2.004 | https://github.com/notofonts/noto-cjk/tree/main/Sans ; subset of existing NotoSansCJKsc-Regular.otf | Noto-Sans-OFL.txt |
| noto-serif-sc.woff2 | Noto Serif CJK SC / 2.003 | https://raw.githubusercontent.com/notofonts/noto-cjk/main/Serif/OTF/SimplifiedChinese/NotoSerifCJKsc-Regular.otf ; subset | Noto-Serif-OFL.txt |
| plex-sans-sc.woff2 | IBM Plex Sans SC / 1.000 | https://raw.githubusercontent.com/IBM/plex/master/packages/plex-sans-sc/fonts/complete/woff2/hinted/IBMPlexSansSC-Regular.woff2 ; subset | IBM-Plex-LICENSE.txt |
| stix-two-math.woff2 | STIX Two Math / 2.13 b171 | https://raw.githubusercontent.com/stipub/stixfonts/v2.13b171/fonts/static_otf_woff2/STIXTwoMath-Regular.woff2 ; unchanged | STIX-OFL.txt |
| newcm-math.woff2 | NewComputerModernMath / 4.0 | https://mirrors.mit.edu/CTAN/fonts/newcomputermodern/otf/NewCMMath-Regular.otf ; full OTF to WOFF2 conversion | NewComputerModern-License.txt |

## Subsetting and naming

fontTools pyftsubset retained every available character in the fixed specimen source plus printable ASCII, with all layout features and their glyph closure. Each requested display character was checked against its source for cmap glyph name, hmtx metrics and RecordingPen outlines: all corresponding values match. No outlines were edited.

For the original typography specimen, Noto Sans and Noto Serif each cover 463 of its 464 requested display characters, exactly as their originals. Neither original includes U+207B (superscript minus). Plex covers 459, exactly as its original; its missing characters in this request are U+00B2, U+00B3, U+207B, U+2212 and U+20BB7. This request includes source-text characters beyond the visible Chinese specimen; it is not a GB 18030 test set.

The page uses Noto Sans after Plex for missing text glyphs, and STIX after the Chinese faces for U+207B. STIX was checked to contain U+207B, U+00B2, U+00B3 and U+2212. A face loading successfully does not imply it renders every displayed character. Formulas use the explicitly selected mathematical face.

Modified internal family names are `Prism Review Noto Sans SC`, `Prism Review Noto Serif SC` and `Prism Review IBM Sans SC Subset`. The IBM derivative removes the OFL reserved name “Plex” from internal family and PostScript names. Its page CSS alias identifies the original design for comparison; this is not a renamed upstream release. Original license files accompany the fonts.

| Chinese subset | Bytes | SHA-256 |
| --- | ---: | --- |
| noto-sans-sc.woff2 | 173936 | d9e9a3e7b9f669ede2d44f9be1d114f5a1c433a2d42edc528e9483585425d2b5 |
| noto-serif-sc.woff2 | 244232 | 03035f423dee7bec7f956a5d1a137d83c66283c8972144ce4f04259085d9ce30 |
| plex-sans-sc.woff2 | 91132 | 264f8ee6f4be957c610835fedc2facc164bd1ce8a2719c04d2cbba9fbe668154 |

## Earlier fixed-sample reading extension

The two Noto subsets now preserve all 464 codepoints in their previous cmap (including glyph closure), plus the reading-review source and representative corrections. Each expanded cmap has 536 codepoints. All 536 mapped glyph names, advance metrics and outlines match the original OTF. Line feed is treated as a control, not a missing display glyph. Plex and the mathematical assets are unchanged. Arbitrary user-entered text can exceed these fixed subsets and use the declared fallback; this remains a bounded candidate, not full production font delivery.

## Shared font delivery

The root layout imports generated `app/fonts.css` once, using `Prism Reading Sans SC` (Noto Sans CJK SC 2.004 variable, wght 100–900) and `Prism Reading Serif SC` (Noto Serif CJK SC 2.003 Regular, 400), plus the existing complete STIX file. Font synthesis remains disabled. Existing resource paths and internal family names are retained; these are renamed derivatives, not upstream releases. Their licenses remain the accompanying Noto-Sans-OFL.txt and Noto-Serif-OFL.txt.

| Shared role | Implementation |
| --- | --- |
| `--font-ui` / Tailwind `font-sans` | Sans, default 400; existing 500/600/650/675/700/750 weights remain supported by the real variable axis. Existing component sizes and interaction rules are unchanged. |
| `--font-reading` / Tailwind `font-serif` | Serif 400 for longer reading and its corresponding editor; ordinary UI descriptions, forms and navigation remain Sans. No synthetic bold/italic. |
| `--font-math` | Complete STIX for the existing native MathML path; Chinese `mtext` uses the reading role. The role is a font stack, not a renderer. |

- Sans source: https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/Variable/OTF/NotoSansCJKsc-VF.otf — SHA-256 `2745e9681cb9d8a5c8901b62c9e1bd98c9c774365fc3b84dd467621013b51cd3`, 44,810 cmap characters.
- Serif source: the complete Regular OTF linked above — SHA-256 `2a2eae2628df83556c54018c41e20fa532c1b862c5256ae8b3f23feb918d12ca`, 44,777 cmap characters.
- Rebuild: `python scripts/build-reading-fonts.py SANS_VF.otf SERIF_REGULAR.otf` with fontTools and Brotli. Normal npm builds consume the committed assets and do not require the font toolchain.
- Assets and hashes: `/fonts/reading/manifest.json`. The common shard covers the current `.ts`/`.tsx` text in `app/` and `components/`, including navigation and catalog content; the exact input file list is recorded as `textSources`. Remaining cmap characters are distributed in disjoint shards of at most 4,096 scalars. CSS unicode-range matches each shard's ordinary cmap. Their union is checked against the complete source ordinary cmap; all 25 format-14 Unicode variation sequences from each source are retained in their base character's shard and inventoried separately. Variable axes/static weights are checked before saving. Hashed asset filenames prevent changes from reusing a stale font URL.
- UI fallback: STIX for supplementary text symbols, then PingFang SC / Microsoft YaHei / Noto Sans CJK SC / sans-serif. Reading fallback: STIX, then Songti SC / SimSun / Noto Serif CJK SC / serif. These system fonts are allowed only when the primary face is unavailable or lacks a character; they are not claimed to be identical. Some Unicode extension ideographs are absent from the source fonts; the build does not invent them.
- Reading-review formulas retain native MathML with the existing complete STIX Two Math WOFF2 and MATH data. MathML mtext uses the reading font for Chinese. If the mathematical face fails, the formula retains its explicit textual expression; conclusions can still be edited. No TeX parser or general formula editor is introduced. No font is globally preloaded merely because its face is declared; unused Serif and STIX assets remain demand-loaded.
- Textarea height updates with input and font loading, independently of CSS field-sizing support. Production support across Windows, macOS, Android and iOS is not established by this implementation alone; current browser observations are recorded in PR #5.

### Common-shard coverage

The generator and build check use the same `app/` and `components/` source scope. Common coverage is no longer limited to the reading candidate. Printable characters and their Unicode bidi mirrors such as ≥ / ≤ stay together to preserve fontTools' mirrored-glyph closure without overlapping shard cmaps. Remaining source characters still ship in separate shards for arbitrary input. Successful rebuilds remove superseded hashed assets listed in the previous manifest.

Exact character counts, byte sizes and variation inventories are recorded per asset in the manifest. The set-minus operator ∖ occurs in MathML and is supplied by the unchanged complete STIX face.

The reason for expanding the corpus was concrete: with the version-25 reading-only common shard, home/layout source text included 66 supported characters outside common and was associated with 9,481,164 bytes of Sans assets; foundation-doc included 333 such characters and was associated with 10,294,692 bytes. These are static source/resource-set comparisons, not measured first-load transfer totals or timing. The shared corpus keeps source-supported page text in common, while user-entered characters outside common may still request additional resources.

Normal site builds run `node scripts/check-reading-fonts.mjs` before vinext. It checks the root font import, corpus file inventory, committed asset sizes/hashes, declared range counts and disjointness, CSS references/weights, common-shard coverage of source-supported site characters, and complete/disjoint variation inventories with each base character in its assigned shard. This lightweight check does not parse actual font tables; generation and independent fontTools audits check actual cmaps against the pinned sources.

### Production acceptance record (2026-09-07)

Status: **shared foundation implemented; other-browser acceptance assigned to the user's manual testing, results pending**. The following version-25 verification started from version 24 (`cf87af8`). The shared-layer extension preserves this coverage and these behaviors, with its own scoped verification below.

- Independent inspection found that version 24 preserved ordinary scalar cmaps but omitted all 25 source format-14 variation sequences per family, including `礼 + FE00` and `郎 + FE00`. The generator now includes the selectors during subsetting, keeps each sequence with its base, and verifies the full sequence inventory. All rebuilt WOFF2 tables were read independently: 44,810 / 44,777 ordinary scalars and 25 / 25 variation sequences match their locked sources. All default/non-default mappings match; all variant outlines and advance widths match the source (Sans at 400/500, Serif at 400). Sans common-shard samples at 400/500/700 also matched before the correction, with real outline changes between 400 and 500. STIX has 4,605 ordinary cmap entries and its MATH table.
- The prior global `loadingerror` listener missed failures completed before hydration and treated unrelated font errors as reading-font failures. The component now inspects the two reading families when listeners are attached, when `document.fonts.ready` resolves, and on loading completion/error. A targeted execution of the actual effect reproduced both old defects and passed after correction, including late failure, recovery and listener cleanup. This logic follows the [CSS Font Loading event and status model](https://www.w3.org/TR/css-font-loading/); `ready` alone is not treated as proof that every font succeeded.
- Cloud Chrome inspected the same checkout at an observed desktop content width of 1,348–1,363 CSS px. Basic Chinese/Latin layout and the full five-step parameter evidence were viewed: fractions, roots, scripts, limits and stretchable fences showed no visible clipping or overlap. Evidence return, editing, applying and undo were exercised.
- Native text selection and clipboard copy round-tripped exactly: `字体校验：龘、𠮷、礼︀、郎︀；x ≥ 1，x ≠ 2，a⁻²，−∞。` plus a second Chinese line and its newline. The editor had matching client/scroll height of 94 px at this width. This is text-copy evidence, not proof of the font used for every character or MathML clipboard semantics.
- In the same browser, temporary missing asset URLs caused real CJK font-load failures: the fallback notice appeared and Chinese content remained readable, editable and copyable. A separate STIX failure produced the explicit formula text and still allowed applying a conclusion. Both fault injections were removed, and normal MathML and the normal page notice returned after reload. No fault URLs remain in the saved source.

| Target / condition | Result |
| --- | --- |
| Cloud Chrome, normal desktop layout and text operations | Observed checks above passed; browser/OS build numbers and per-glyph actual-font hits were not exposed by this test surface. |
| Windows Edge, macOS Safari, desktop Firefox | User will test manually; awaiting actual versions and results. |
| Android Chrome, iOS Safari | User manual testing pending; no mobile-platform claim. |
| Narrow viewport, 200% native zoom, cold-cache/slow-network timing, actual font hits, MathML copy semantics, screen-reader output | Not verified. The available browser controls did not establish native zoom or expose network throttling/font-hit inspection. |

The user has taken responsibility for other-browser testing and authorized subsequent work to proceed. Those results will be recorded against the actual OS/browser versions using the existing Foundations criteria. Desktop results do not replace that platform evidence.

### Shared-foundation verification (2026-09-07)

- The root layout now owns the single complete-font import; duplicate STIX face declarations were removed. Sans is the shared UI default, Serif is an explicit reading role, and existing component weights remain unchanged. The original comparison aliases remain isolated.
- Independent fontTools inspection of all 24 regenerated WOFF2 files confirmed that their actual cmaps match their declared ranges, remain disjoint and exactly reproduce the two pinned source cmaps. Each common shard has 1,240 characters: Sans 402,724 bytes; Serif 449,524 bytes. All source-supported characters in the current app/components corpus are in common. These are asset sizes, not measured network transfers.
- Sans retains the real 100–900 weight axis in every shard; Serif remains static 400. All 25 variation sequences per family match the originals. Independent variant-outline and advance comparisons passed for Sans at 400/500/650/675/700/750 (150 comparisons) and Serif at 400 (25 comparisons).
- The normal font build check and Sites production build passed. No new broad component test suite was introduced.
- The cloud browser rejected the preview-page reload under its URL policy, so this extension has **no new browser visual or interaction acceptance result**. The version-25 browser observations above remain historical evidence for that version. Manual cross-browser results and this extension's visual regression remain pending.

## Scope

The comparison remains bounded; the shared site foundation ships the full source cmap and variation inventory through shards. This is not a product-wide GB 18030 or WCAG conformity claim. Serif remains an explicit reading role, and the existing MathML interaction remains in the reading candidate. No Card implementation, component redesign or general mathematical editor is introduced by the shared font change. The mathematical faces contain no Chinese ideographs.
