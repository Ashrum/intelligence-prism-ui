import type { DirectorySelections, TextbookDefinition } from "@/components/prism-next/textbook-directory"
import { directoryLeaves, firstLeafSelection, type DirectoryData, type DirectoryKind } from "@/lib/prism-next/textbook-directory"

// Demo host adapter only. Components never access storage.
const prefix = "prism:directory:A:v1:"
const kinds: DirectoryKind[] = ["course", "knowledge"]
type MemoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">
export const directoryMemoryKey = (scope: string) => `${prefix}${scope}`
export const defaultDirectorySelection = (data: DirectoryData, kind: DirectoryKind) => kind === "course" ? firstLeafSelection(data) : []
export function defaultDirectorySelections(books: TextbookDefinition[]): DirectorySelections {
  return Object.fromEntries(books.flatMap(book => kinds.map(kind => [`${book.id}:${kind}`, defaultDirectorySelection(book.directories[kind], kind)])))
}
export function restoreDirectorySelections(books: TextbookDefinition[], getStorage: () => MemoryStorage): DirectorySelections {
  const defaults = defaultDirectorySelections(books)
  try {
    const storage = getStorage()
    return Object.fromEntries(books.flatMap(book => kinds.map(kind => {
      const scope = `${book.id}:${kind}`, data = book.directories[kind]
      try {
        const raw = storage.getItem(directoryMemoryKey(scope))
        const stored = raw === null ? null : JSON.parse(raw)
        const value: unknown = stored?.ids
        const valid = Array.isArray(value) && value.every(id => typeof id === "string" && data.leafIds.includes(id))
        const currentLeaves = typeof stored?.currentId === "string" && data.paths[stored.currentId] ? directoryLeaves(data, stored.currentId) : []
        const validCurrent = stored?.currentId === undefined || (valid && currentLeaves.length > 0 && currentLeaves.length === new Set(value as string[]).size && currentLeaves.every(id => (value as string[]).includes(id)))
        return [scope, valid && validCurrent ? [...new Set(value as string[])] : defaults[scope]]
      } catch { return [scope, defaults[scope]] }
    })))
  } catch { return defaults }
}
export function saveDirectorySelections(books: TextbookDefinition[], selections: DirectorySelections, getStorage: () => MemoryStorage, currentNodes: Record<string, string> = {}): DirectorySelections {
  try {
    const storage = getStorage()
    for (const book of books) for (const kind of kinds) {
      const scope = `${book.id}:${kind}`
      storage.setItem(directoryMemoryKey(scope), JSON.stringify({ ids: selections[scope] ?? defaultDirectorySelection(book.directories[kind], kind), currentId: currentNodes[scope] }))
    }
    return selections
  } catch { return defaultDirectorySelections(books) }
}
export function clearDirectoryMemory(getStorage: () => MemoryStorage) {
  try {
    const storage = getStorage()
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => key?.startsWith(prefix) ?? false)
    keys.forEach(key => storage.removeItem(key))
  } catch { /* The caller also resets in-memory state when storage is blocked. */ }
}

// Preserve the exact single-node target even when a chain of one-child folders
// covers the same leaves. This is host metadata, not directory tree state.
export function restoreDirectoryCurrentNodes(books: TextbookDefinition[], selections: DirectorySelections, getStorage: () => MemoryStorage): Record<string, string> {
  const currents: Record<string, string> = {}
  try {
    const storage = getStorage()
    for (const book of books) for (const kind of kinds) {
      const scope = `${book.id}:${kind}`, data = book.directories[kind]
      try {
        const value = JSON.parse(storage.getItem(directoryMemoryKey(scope)) ?? "null")
        const id = value?.currentId, ids = selections[scope] ?? []
        const leaves = typeof id === "string" && data.paths[id] ? directoryLeaves(data, id) : []
        if (leaves.length && leaves.length === ids.length && leaves.every(leaf => ids.includes(leaf))) currents[scope] = id
      } catch { /* Invalid metadata falls back to the canonical leaf selection. */ }
    }
  } catch { /* No persistence is required for the default selection. */ }
  return currents
}
