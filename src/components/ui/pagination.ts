// Shared "fits without scrolling" mechanism (UI_PASS_SPEC.md §2): screens
// with a growing list swap an unbounded overflow-y-auto region for a fixed
// page of items plus PageControls, instead of letting the list itself grow
// past the viewport. Pure UI-state hook — no store coupling.

import { useEffect, useMemo, useState } from 'react'

export interface Pagination<T> {
  page: number
  pageCount: number
  pageItems: T[]
  setPage: (page: number) => void
}

export function usePagination<T>(items: T[], pageSize: number): Pagination<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const [page, setPage] = useState(0)

  // Items shrinking (e.g. a filter change) can leave `page` pointing past
  // the new last page — snap back rather than showing an empty page.
  useEffect(() => {
    if (page > pageCount - 1) setPage(0)
  }, [pageCount, page])

  const clampedPage = Math.min(page, pageCount - 1)
  const pageItems = useMemo(
    () => items.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize),
    [items, clampedPage, pageSize],
  )

  return { page: clampedPage, pageCount, pageItems, setPage }
}
