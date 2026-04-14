import type { TaskStatus } from './types'

export interface StatusStyle {
  fill: string
  opacity: number
  label: string
  dotBg: string
  dotBorder: string | null
}

export const STATUS_COLORS: Record<TaskStatus, StatusStyle> = {
  done: {
    fill: '#10b981',
    opacity: 0.85,
    label: 'Concluído',
    dotBg: '#10b981',
    dotBorder: null,
  },
  active: {
    fill: '#3b82f6',
    opacity: 1,
    label: 'Em andamento',
    dotBg: '#3b82f6',
    dotBorder: null,
  },
  next: {
    fill: '#6366f1',
    opacity: 0.3,
    label: 'Próximo',
    dotBg: '#6366f1',
    dotBorder: null,
  },
  planned: {
    fill: 'none',
    opacity: 0.5,
    label: 'Planejado',
    dotBg: 'transparent',
    dotBorder: '#525252',
  },
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
