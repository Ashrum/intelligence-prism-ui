import { DocsShell } from "@/components/prism/docs-shell"

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  return <DocsShell>{children}</DocsShell>
}
