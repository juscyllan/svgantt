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
    fill: '#34d399',
    opacity: 1,
    label: 'Concluído',
    dotBg: '#34d399',
    dotBorder: null,
  },
  active: {
    fill: '#fbbf24',
    opacity: 1,
    label: 'Em andamento',
    dotBg: '#fbbf24',
    dotBorder: null,
  },
  next: {
    fill: '#60a5fa',
    opacity: 0.25,
    label: 'Próximo',
    dotBg: '#60a5fa',
    dotBorder: null,
  },
  planned: {
    fill: 'none',
    opacity: 0.5,
    label: 'Planejado',
    dotBg: 'transparent',
    dotBorder: '#737373',
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
