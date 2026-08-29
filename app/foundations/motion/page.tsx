import type { Metadata } from "next"
import { FoundationDoc } from "@/components/prism/foundation-doc"

export const metadata: Metadata = { title: "动效" }
export default function Page() { return <FoundationDoc slug="motion" /> }
