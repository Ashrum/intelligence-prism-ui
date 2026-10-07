"use client"

// Internal rendering seam for review fixtures; not a supported component API.
// Without a provider TextbookDirectory keeps its original markup and behavior.
import { createContext, type ComponentType } from "react"
import type { TreeInstance } from "@headless-tree/core"
import type { DirectoryData, DirectoryKind, DirectoryNode, projectDirectory } from "@/lib/prism-next/textbook-directory"

export type DirectoryViewProps = {
  data: DirectoryData; projection: ReturnType<typeof projectDirectory>; selectionTree: TreeInstance<DirectoryNode>
  currentId: string; onCurrentChange: (id: string) => void; initialExpanded: string[]
  onExpandedChange: (ids: string[]) => void; label: string; helpId: string
  titleAction: "locate" | "select"; showCheckboxes: boolean
}

export const DirectoryPresentation = createContext<{
  View: ComponentType<DirectoryViewProps>
  kind: DirectoryKind
  onKindChange: (kind: DirectoryKind) => void
} | null>(null)
