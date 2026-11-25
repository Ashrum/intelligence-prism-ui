# Current state

- This npm workspace uses Node 24.14.0 and npm 11.9.0.
- `packages/ui` exports `@ole/ui` 0.1.0 for React 19. The 46 COSS modules live in `src/coss/` and use Base UI 1.8.0.
- `apps/gallery` is a static Vite/React/Tailwind CSS v4 gallery that consumes the public package exports.

## Working here

- Run `npm ci` to install the locked workspace and `npm run check` to run the dependency guard, type checks, and production builds.
- Run `npm run dev` or `npm run preview` from the root. Both use loopback port 5188 with strict port selection.
- Keep `@ole/ui` and its lockfile dependency tree free of `@radix-ui/*`, `radix-ui`, `vaul`, and `sonner`. Keep package entry points ESM with declaration files.
- Set `data-prism-theme` to `light` or `dark`. The existing `blueprint` and `blueprint-night` values map to those themes.
- Keep portal hosts inside the intended theme boundary and outside clipped or transformed surfaces. Preserve Base UI keyboard behavior, focus return, and reduced-motion support.
- Keep `SOURCE.md` and `LICENSE` with the component port. Keep generated files and package caches out of Git.
