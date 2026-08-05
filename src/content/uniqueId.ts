/** Fail fast at module load if any two content items share the same id. */
export function assertUniqueIds<T>(
  kind: string,
  items: readonly T[],
  getId: (item: T) => PropertyKey,
): void {
  const seen = new Set<PropertyKey>()
  for (const item of items) {
    const id = getId(item)
    if (seen.has(id)) throw new Error(`Duplicate ${kind} id: ${String(id)}`)
    seen.add(id)
  }
}
