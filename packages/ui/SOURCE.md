# Source and attribution

The 46 modules in `src/coss/` are the COSS component snapshot from the OLE school workbench's `src/components/coss/` directory. They originate in the COSS UI component registry.

The workbench snapshot fingerprint is `934b7a259cc8d6e1ad2f2c6f9578b640774652b04c4a5416a7807445eb2a34f5`. It hashes the filename, a NUL byte, and the binary SHA-256 digest of each source file in filename order.

- [COSS UI component registry](https://coss.com/ui/docs)
- [COSS registry source and MIT licensing for the UI subtree](https://github.com/cosscom/coss/blob/19620ae8cae81e30775f2cde03829326cb4916b2/LICENSING.md)
- [COSS UI and Origin UI copyright notice](https://github.com/cosscom/ui/blob/main/LICENSE)

The port replaces workbench aliases with local ESM imports and supplies the class merger, sidebar media query, and tabs size classes within the package. Portal wrappers resolve the host through React context while Base UI handles focus and positioning.

Smart Prism uses the workbench's `src/theme/prism.css` and the ruler and portal contracts in `src/components/prism-next/` as its references. The universal theme ships light and dark token sets, the three Prism brand colors, a semantic type scale, and a standalone responsive ruler stylesheet.

The package retains the upstream MIT notice in [LICENSE](LICENSE).
