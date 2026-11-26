# FilterBar source and attribution

The FilterBar single-piece adapts COSS Particles from [cosscom/ui](https://github.com/cosscom/ui) at commit `11f4620946e5fb0e2c12a815388ccdf5b3120dd0`. The upstream [MIT license](https://github.com/cosscom/ui/blob/11f4620946e5fb0e2c12a815388ccdf5b3120dd0/LICENSE) is reproduced in [LICENSE](LICENSE).

| Upstream source path | Dependency surface in the upstream file |
| --- | --- |
| `apps/examples/calcom/components/app/filter-chip-shell.tsx` | COSS Button, Group and class merger, Lucide, React |
| `apps/examples/calcom/components/app/filter-chip-options.tsx` | COSS Avatar, Badge, Button, Combobox and class merger, Lucide, React, local filter shell and types |
| `apps/examples/calcom/components/app/filter-bar-actions.tsx` | COSS Button and class merger, React |

These are application example modules, so the port records their imports in place of per-file registry manifests. The local adaptation uses the existing `@ole/ui` COSS Button, Group and Base UI Popover with Lucide and the local class merger. Popover inherits the `PortalScope` container and delegates positioning and focus to Base UI. The controlled single-choice model accepts optional counts, preserves the selected zero-count option, and supports a removable text-only chip. Labels and accessible names come from the caller. Tailwind v4 semantic tokens and the existing `prefers-reduced-motion` theme rules cover the chip and its popup.

Net new npm dependencies for C5: **0**. Dice UI's `base/ui/faceted.tsx` imports `cmdk`, which OLE_FRONTEND_COMPONENT_SYSTEM_SPEC_v1.5 §2.4 excludes.

## Wave 2 reference sources

The local `Editable`, `TagsInput`, and `FileUpload` implementations use the existing Base UI inputs or COSS buttons, Lucide icons, and `cn`. The [Dice UI MIT registry](https://github.com/sadmann7/diceui/blob/618791b98e571772db9fd643c244b62df71bb726/LICENSE) at `618791b98e571772db9fd643c244b62df71bb726` was reviewed for their interaction contracts.

| Reference | Local scope |
| --- | --- |
| [Base Editable](https://github.com/sadmann7/diceui/blob/618791b98e571772db9fd643c244b62df71bb726/docs/registry/bases/base/ui/editable.tsx) | Single-line editing, explicit commit and cancel, focus return |
| [Base Tags Input](https://github.com/sadmann7/diceui/blob/618791b98e571772db9fd643c244b62df71bb726/docs/registry/bases/base/ui/tags-input.tsx) | Local tag state and delimited input, with no registry package dependency |
| [Base File Upload](https://github.com/sadmann7/diceui/blob/618791b98e571772db9fd643c244b62df71bb726/docs/registry/bases/base/ui/file-upload.tsx) | Native file picker and local queue with type and size validation |

Net new npm dependencies for the three particles: **0**.
