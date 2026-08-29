import type { Metadata } from "next"

import { ComponentDoc } from "@/components/prism/component-doc"

export const metadata: Metadata = { title: "Button" }

export default function Page() { return <ComponentDoc slug="button" /> }
