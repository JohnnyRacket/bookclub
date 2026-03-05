export function isCleanTag(tag: string): boolean {
  return !tag.includes(':') && !tag.includes('_') && tag.length <= 24;
}
