import { Button } from '../../ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

type PaginationProps = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export const Pagination = ({ page, totalPages, onChange }: PaginationProps) => (
  <div className="flex items-center gap-2 text-sm">
    <Button type="button" variant="outline" size="sm" disabled={page === 1} onClick={() => onChange(Math.max(1, page - 1))}>
      <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Prev
    </Button>
    <span>
      Page {page} of {totalPages}
    </span>
    <Button type="button" variant="outline" size="sm" disabled={page === totalPages} onClick={() => onChange(Math.min(totalPages, page + 1))}>
      Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </Button>
  </div>
)

export default Pagination
