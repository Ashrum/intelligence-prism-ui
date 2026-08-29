import type { Metadata } from "next"

import { ComponentDoc } from "@/components/prism/component-doc"

export const metadata: Metadata = { title: "Card" }

export default function Page() { return <ComponentDoc slug="card" /> }
