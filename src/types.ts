export type TaskStatus = 'done' | 'active' | 'next' | 'planned'

export interface Task {
  name: string
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
  status: TaskStatus
}

export interface Phase {
  name: string
  accent: string // CSS hex color
  tasks: Task[]
}

export interface Milestone {
  name: string
  date: string // YYYY-MM-DD
  color: string
}

export interface GanttData {
  phases: Phase[]
  milestones: Milestone[]
  projectStart: string
  projectEnd: string
  title?: string
}

export interface GanttOptions {
  /** Label column width on desktop (default: 200) */
  labelWidth?: number
  /** Label column width on mobile (default: 140) */
  labelWidthMobile?: number
  /** Row height on desktop (default: 44) */
  rowHeight?: number
  /** Row height on mobile (default: 32) */
  rowHeightMobile?: number
  /** Minimum pixels per day (default: 18) */
  minDayWidth?: number
  /** Mobile breakpoint in px (default: 640) */
  mobileBreakpoint?: number
  /** Locale for date formatting (default: 'pt-BR') */
  locale?: string
  /** Today label text (default: 'HOJE') */
  todayLabel?: string
  /** Header label text (default: 'TAREFAS') */
  headerLabel?: string
  /** Enable drag-to-scroll (default: true) */
  dragToScroll?: boolean
  /** Enable tooltip on hover (default: true) */
  tooltip?: boolean
  /** Auto-scroll to today on mount (default: true) */
  scrollToToday?: boolean
}

export interface GanttInstance {
  /** Update chart with new data */
  update(data: Partial<GanttData>): void
  /** Scroll timeline to center on today */
  scrollToToday(): void
  /** Force re-render (e.g. after container resize) */
  refresh(): void
  /** Tear down event listeners and clear DOM */
  destroy(): void
}
