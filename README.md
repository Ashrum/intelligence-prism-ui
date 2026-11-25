# OLE UI System

`@ole/ui` is a React 19 component library with 46 COSS modules built on Base UI 1.8.0. Smart Prism (一色一尺) provides the light and dark themes, semantic type, and optional sheet rulers. The gallery uses the same package exports as a consumer.

## Workspace

Use Node 24.14.0 and npm 11.9.0.

```sh
npm ci
npm run check
npm run dev
```

The development gallery runs at http://127.0.0.1:5188. Run `npm run build` to emit the UI ESM and declarations into `packages/ui/dist` and the static site into `apps/gallery/dist`. Run `npm run preview` to serve the production gallery locally on port 5188.

`npm run check` checks the UI package's dependencies and reachable npm lockfile entries, runs `tsc --noEmit` for both workspaces, and builds both packages. The UI dependency guard covers direct and transitive dependencies, peers, optional dependencies, and npm aliases.

## Use the package

Install `@ole/ui` with React 19 and React DOM 19 in your application. Add these imports to the stylesheet compiled by Tailwind CSS v4.

```css
@import "tailwindcss";
@import "@ole/ui/styles/theme.css";
@import "@ole/ui/styles/ruler.css";
```

The theme registers the package's compiled components for Tailwind class scanning. Import the ruler sheet when using `PrismRulerShell`. Its top marks (01–08) and left marks (A–D) hide when the viewport or sheet is narrower than 1080 CSS pixels.

```tsx
import { useState } from "react";
import {
  Button, Dialog, DialogPopup, DialogTitle, DialogTrigger,
  PortalScope, PrismRulerShell,
} from "@ole/ui";

export function Workspace() {
  const [portalHost, setPortalHost] = useState<HTMLDivElement | null>(null);

  return (
    <div data-prism-theme="light">
      <PortalScope container={portalHost}>
        <PrismRulerShell>
          <Dialog>
            <DialogTrigger render={<Button />}>Open</DialogTrigger>
            <DialogPopup>
              <DialogTitle>Assignment details</DialogTitle>
            </DialogPopup>
          </Dialog>
        </PrismRulerShell>
      </PortalScope>
      <div ref={setPortalHost} />
    </div>
  );
}
```

`data-prism-theme` defaults to light. Set it to `dark` for dark mode. Existing `blueprint` and `blueprint-night` attributes map to light and dark. Use `text-ui-*` for interface copy, `text-read-*` for longer text, and `text-block-title` for section titles. The brand palette is Sky `#4EB1D9`, Pink `#E0438F`, and Lime `#C2F25B`.

COSS popup wrappers and toast providers use the nearest `PortalScope` by default. An overlay can override that host with `portalProps.container`. Pass `null` to wait for a host to mount. Without a scope, Base UI picks the parent portal or the document body as appropriate. The same scoped wrappers are available from `@ole/ui/scoped-overlays`.

The type scale and component utilities target Tailwind CSS v4. Theme CSS uses `@scope` to keep light and dark variants within the nearest theme boundary.

## Sources

See [component provenance](packages/ui/SOURCE.md) and the [MIT license and notices](packages/ui/LICENSE).
