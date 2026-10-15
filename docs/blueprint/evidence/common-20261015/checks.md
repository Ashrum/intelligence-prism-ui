# Common Blueprint components · 2026-10-15

Baseline: `55f25df36af5a8aaaa2374fed0427d9379b501e2` / Site v119. Browser: local Chromium through Playwright CLI, Windows, DPR 1. Source and publication are reconciled after acceptance; this record does not predeclare a Site version or merge SHA.

## Browser evidence

- `before.json`: existing 12 component pages before this change, all HTTP 200 at 1280px.
- `interactions.json`: 31 assertions passed. Input and Textarea error-to-valid transitions, one visible field focus outline, readonly and disabled states, Select keyboard/disabled option/Esc, Checkbox Space, Radio arrows, Switch Space, both Tabs variants, Dialog initial focus/validation/nested Select/Esc/focus containment/final focus/local save.
- `matrix.json`: four themes × 320/768/1280px, all 12 samples present, no document horizontal overflow. Eight real Dialog + nested Select portal scenarios; both portals stay in the common preview container. Global core appearance equals corresponding local core appearance under global Blueprint. Local Blueprint under global light equals global Blueprint. Select printed surface has no shadow.
- `routes.json`: the existing 12 component pages plus Input Group at 320/1280px: 26 HTTP 200 checks, no document horizontal overflow. Input Group inner unstyled controls remain borderless. Checked invalid Checkbox paints an inset destructive line on its indicator; DialogFooter corner radius is 0.
- `final-focus.json`: stable keyboard focus at 320px after the Dialog closing transition. Tabs uses a 2px blue inner outline, -3px offset, and a 4px paper separation layer. Focus is visible; no horizontal document overflow. This supersedes the earlier route snapshot captured during a shadow transition.

Screens in `../../screens/common-20261015/` were visually reviewed for the desktop common sheet, actual nested popup, checked error, and narrow Tabs focus. Checkbox / Switch states each occupy a separate line. No real teacher task, permissions, saving service, or simulated task progression was added.

## Build and repository checks

- Math font integrity, typography (307 owned TSX), TypeScript and vinext production build passed.
- Initial full suite: 1949 total / 1686 passed / 263 failed / 0 skipped. Compared with the immediately preceding ruler baseline, exactly two additional failures concern the generated guide JSON and downloaded STATUS bytes awaiting synchronization. The other 261 failure descriptions are identical to that baseline.
- Initial Blueprint suite: 39 total / 37 passed / 2 generated-guide failures. Final results are recorded after guide synchronization below.
- Frozen coss sources, core theme tokens and dependencies have no changes.

## Limits

CSS `zoom: 2` at 1280px was checked with no document overflow. Native browser 200% zoom is not verified: Ctrl++ did not change viewport width, DPR or visual viewport scale in this runner. This is not a substitute for native zoom acceptance. This pass does not claim screen-reader, physical-device, physical-print, all formula combinations, or checked-invalid Radio coverage. Tabs retains the pinned library behavior: disabled tabs may receive arrow-key focus but cannot activate.

## Final synchronized checks

Final synchronized run: math-font, typography (307 owned TSX), production build and TypeScript exited 0; Blueprint tests **39/39 passed**. Full suite: **1949 total / 1688 passed / 261 failed / 0 skipped**, exit 1. Failure-description comparison against the ruler baseline: new = [], removed = []. See `final-failure-delta.json`; this is unchanged failure-set evidence, not a claim that each Windows failure was individually re-proven or fixed. Independent review: PASS WITH NOTES; see `review.md`.
