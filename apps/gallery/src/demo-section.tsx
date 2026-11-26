import type { ReactNode } from "react";

export function DemoSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="demo-section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="text-block-title">{title}</h2>
      {children}
    </section>
  );
}
