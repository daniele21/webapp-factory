import type { ReactNode } from 'react'

export type NavItem = {
  id: string
  label: string
  icon?: ReactNode
  to?: string
  href?: string
  badge?: string
  badgeTone?: 'neutral' | 'accent' | 'warning' | 'success'
  description?: string
  children?: NavItem[]
  end?: boolean
  target?: '_blank' | '_self'
  feature?: string
}

export type BreadcrumbItem = {
  label: string
  href?: string
  icon?: ReactNode
}

export type TableQuery = {
  page: number
  pageSize: number
  sort?: { id: string; desc?: boolean } | null
  filters?: Record<string, unknown>
  search?: string
}

export type TablePage<T> = {
  data: T[]
  page: number
  pageSize: number
  total: number
}

export type TimelineItem = {
  id: string
  title: string
  timestamp: string | Date
  description?: string
  icon?: ReactNode
  by?: string
  meta?: string
  badge?: string
}

export type KeyValueItem = {
  key: ReactNode
  value: ReactNode
  helpText?: ReactNode
  copyable?: boolean
}

export type TagOption = {
  label: string
  value: string
  icon?: ReactNode
  disabled?: boolean
}

export type SelectOption = {
  label: string
  value: string
  description?: string
  icon?: ReactNode
}

export type RatingValue = 0 | 1 | 2 | 3 | 4 | 5

export type Step = {
  id: string
  label: string
  status?: 'complete' | 'current' | 'pending'
}

