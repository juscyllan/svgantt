import type { GanttTheme, TaskStatus } from './types'

export interface StatusStyle {
  opacity: number
  label: string
}

export const STATUS_META: Record<TaskStatus, StatusStyle> = {
  done: { opacity: 0.85, label: 'Concluído' },
  active: { opacity: 1, label: 'Em andamento' },
  next: { opacity: 0.3, label: 'Próximo' },
  planned: { opacity: 0.5, label: 'Planejado' },
}

export const DEFAULT_THEME: GanttTheme = {
  statusDone: '#10b981',
  statusActive: '#3b82f6',
  statusNext: '#6366f1',
  statusPlannedStroke: '#525252',
  today: '#ef4444',
  todayText: '#ffffff',
  bgTimeline: '#000000',
  bgLabels: '#0a0a0a',
  bgMilestoneLabel: '#050505',
  textFaint: '#3a3a3a',
  textMuted: '#525252',
  textNormal: '#737373',
  textStrong: '#ffffff',
  textPlannedBar: '#8a8a8a',
  textNextBar: '#c4d6f5',
  accentGlow: '#fbbf24',
  overlayRgb: '255,255,255',
}

export function statusFill(theme: GanttTheme, status: TaskStatus): string {
  if (status === 'done') return theme.statusDone
  if (status === 'active') return theme.statusActive
  if (status === 'next') return theme.statusNext
  return 'none'
}

export const HEADER_H = 48
export const PAD_BOTTOM = 8
export const PHASE_ROW_H_DESKTOP = 28
export const PHASE_ROW_H_MOBILE = 24

export const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

export const FONT_MONO = "var(--font-mono, 'JetBrains Mono'), monospace"
export const FONT_SANS = "var(--font-sans, 'Inter'), system-ui, sans-serif"
