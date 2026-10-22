// Undo only P110's approved class addition on the first tool button, so older
// independent baseline snapshots continue to protect all other SSR bytes.
export function withoutPromptOpticalAlignment(html) {
  return html.replace(/<button\b[^>]*aria-label="添加附件与来源"[^>]*>/, button => button.replace(' -ml-1.75 sm:-ml-1.5', ''));
}
