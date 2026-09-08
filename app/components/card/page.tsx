import type { Metadata } from "next"

import { CardDoc } from "@/components/prism/card-doc"

export const metadata: Metadata = { title: "Card" }

export default function Page() { return <CardDoc /> }
