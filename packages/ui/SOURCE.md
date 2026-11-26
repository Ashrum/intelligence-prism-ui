# Source and attribution

The original 46 modules in `src/coss/` came from the COSS component snapshot in the OLE school workbench's `src/components/coss/` directory. They originate in the COSS UI component registry.

The workbench snapshot fingerprint is `934b7a259cc8d6e1ad2f2c6f9578b640774652b04c4a5416a7807445eb2a34f5`. It hashes the filename, a NUL byte, and the binary SHA-256 digest of each source file in filename order.

- [COSS UI component registry](https://coss.com/ui/docs)
- [COSS registry source and MIT licensing for the UI subtree](https://github.com/cosscom/coss/blob/19620ae8cae81e30775f2cde03829326cb4916b2/LICENSING.md)
- [COSS UI and Origin UI copyright notice](https://github.com/cosscom/ui/blob/main/LICENSE)

The port replaces workbench aliases with local ESM imports and supplies the class merger, sidebar media query, and tabs size classes within the package. Portal wrappers resolve the host through React context while Base UI handles focus and positioning.

Smart Prism uses the workbench's `src/theme/prism.css` and the ruler and portal contracts in `src/components/prism-next/` as its references. The universal theme ships light and dark token sets, the three Prism brand colors, a semantic type scale, and a standalone responsive ruler stylesheet.

Version 0.2.0 adds `accordion.tsx`, `alert-dialog.tsx`, `context-menu.tsx`, and `preview-card.tsx` from the MIT-licensed Base UI registry at `cosscom/ui@11f4620946e5fb0e2c12a815388ccdf5b3120dd0`. The port uses the package class merger, scoped popup portals, and Smart Prism's light-mode background clipping. These four modules require no additional npm dependencies. [Pinned upstream source and license](https://github.com/cosscom/ui/tree/11f4620946e5fb0e2c12a815388ccdf5b3120dd0)

Version 0.2.0 also incorporates the Workbench contracts for Smart Prism font-size merging, segmented-control item sizes and icon layout, named sidebar breakpoints and configurable sidebar persistence, popover collision settings, and the paper theme's light variant.

The package retains the upstream MIT notice in [LICENSE](LICENSE).
