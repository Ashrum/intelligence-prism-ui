# Typography review font sources

The isolated `/review/typography` page compares Regular (400) faces; `/review/reading-review` applies the selected Noto Sans, Noto Serif and STIX faces to a continuous review scenario. The three Chinese WOFF2 files are **fixed-sample subsets**, not production character coverage. Their requested display characters retain the original cmap glyph names, advance metrics and outlines. The two mathematical fonts are complete and retain OpenType MATH data. Page-specific CSS aliases leave the formal site font stack unchanged.

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

## Reading-review extension

The two Noto subsets now preserve all 464 codepoints in their previous cmap (including glyph closure), plus the reading-review source and representative corrections. Each expanded cmap has 536 codepoints. All 536 mapped glyph names, advance metrics and outlines match the original OTF. Line feed is treated as a control, not a missing display glyph. Plex and the mathematical assets are unchanged. Arbitrary user-entered text can exceed these fixed subsets and use the declared fallback; this remains a bounded candidate, not full production font delivery.

## Scope

The page is a visual comparison, not a product-wide GB 18030 or WCAG conformity claim. Production character coverage, weights, platform fallbacks, font delivery and the formula renderer remain to be decided after the design is reviewed. The mathematical faces contain no Chinese ideographs. The complete original Chinese fonts are not bundled into this fixed-sample review.
