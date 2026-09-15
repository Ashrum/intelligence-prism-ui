# coss Origin Tree adaptation

Source: https://github.com/cosscom/coss/tree/e937becd2d5ffb5c621eed6f8b1f223cbb6051e7/apps/origin

- Base: `registry/default/ui/tree.tsx`
- Examples consulted: `registry/default/components/comp-598.tsx` (checkboxes), `comp-572.tsx` (filtering), `comp-573.tsx` (separate click behavior).
- Adapted implementation: `components/prism-next/tree.tsx` and `components/prism-next/textbook-directory.tsx`.
- Dependencies: `@headless-tree/core@1.5.1`, `@headless-tree/react@1.5.1`.

This is an adapted extension, not an unmodified coss UI primitive. Keep the 54 vendored coss UI components and their source hashes unchanged.

Changes: remove unneeded Radix Slot/asChild and drag line; render treeitem as div to permit sibling coss Checkbox/Button controls without nested buttons; preserve library focus/keyboard/ARIA; wrap long Chinese labels; use current theme tokens. The unfiltered Headless Tree checkbox model owns propagated leaf selection, while a filtered tree projection owns visible keyboard navigation. Do not copy the upstream CSS-only hidden-item filter.

MIT License

Copyright (c) 2025 coss.com
Originally Copyright (c) 2025 Origin UI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
