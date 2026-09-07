import type { Metadata } from "next"
import { TextFieldsReview } from "./text-fields-review"
import "./text-fields.css"

export const metadata: Metadata = { title: "Text Fields · 中文场景候选" }

export default function TextFieldsPage() { return <TextFieldsReview /> }
