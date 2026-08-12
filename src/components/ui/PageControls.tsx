// Prev/Next + "Page X/Y" — the visible half of pagination.ts's usePagination
// (UI_PASS_SPEC.md §2). Renders nothing for a single page, so callers can
// mount it unconditionally.

import { CyberButton } from './CyberButton'

export interface PageControlsProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
  className?: string
}

export function PageControls({ page, pageCount, onChange, className = '' }: PageControlsProps) {
  if (pageCount <= 1) return null
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <CyberButton className="!px-3 !py-1.5 !text-xs" disabled={page === 0} onClick={() => onChange(page - 1)}>
        Prev
      </CyberButton>
      <span className="font-display text-xs uppercase tracking-widest text-white/50">
        Page {page + 1} / {pageCount}
      </span>
      <CyberButton className="!px-3 !py-1.5 !text-xs" disabled={page === pageCount - 1} onClick={() => onChange(page + 1)}>
        Next
      </CyberButton>
    </div>
  )
}
