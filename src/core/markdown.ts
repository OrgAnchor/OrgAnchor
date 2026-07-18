export function escapeMarkdownTableCell(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("|", "\\|").replace(/[\r\n]+/g, " ");
}
