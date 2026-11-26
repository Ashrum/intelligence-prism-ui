# Current state

- Use the Node version pinned in `.nvmrc` and the npm version declared in `package.json` under `packageManager`.
- `packages/ui` exports the `@ole/ui` 0.3.0 candidate for React 19. The 50 COSS modules live in `src/coss/` and use Base UI 1.8.0. The package also exports `DataTable`, `FilterBar`, `VirtualList`, resizable panels, `Calendar`, `DatePicker`, `Editable`, `TagsInput`, and `FileUpload`.
- `apps/gallery` is a static Vite/React/Tailwind CSS v4 gallery that consumes the public package exports.

## Working here

- Install from the lockfile with `npm ci --legacy-peer-deps=false --strict-peer-deps --engine-strict` and run `npm run check` to execute the dependency/dist guards (`--verify-dist`), type checks, and production builds.
- Run `npm test` after building `@ole/ui` to test the public ESM exports and primitive helpers.
- Run `npm run dev` or `npm run preview` from the root. Both use loopback port 5188 with strict port selection.
- Keep `@ole/ui` and its lockfile dependency tree free of `@radix-ui/*`, `radix-ui`, `@mui/*`, `@emotion/*`, `vaul`, and `sonner`. Keep package entry points ESM with TypeScript 5.9-compatible declaration files.
- Set `data-prism-theme` to `light`, `dark`, `blueprint`, `blueprint-night`, or `paper`. Blueprint and paper use the light UI tokens, and blueprint-night uses the dark UI tokens.
- Keep portal hosts inside the intended theme boundary and outside clipped or transformed surfaces. Preserve Base UI keyboard behavior, focus return, and reduced-motion support.
- Keep `SOURCE.md` and `LICENSE` with the component port. Keep generated files and package caches out of Git.
