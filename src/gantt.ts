import {
  FONT_MONO,
  FONT_SANS,
  HEADER_H,
  MONTH_NAMES,
  PAD_BOTTOM,
  STATUS_COLORS,
} from './constants'
import { el, svg } from './svg'
import type {
  GanttData,
  GanttInstance,
  GanttOptions,
  Phase,
  Task,
} from './types'

interface ResolvedOpts {
  labelWidth: number
  labelWidthMobile: number
  rowHeight: number
  rowHeightMobile: number
  minDayWidth: number
  mobileBreakpoint: number
  locale: string
  todayLabel: string
  headerLabel: string
  dragToScroll: boolean
  tooltip: boolean
  scrollToToday: boolean
}

const DEFAULTS: ResolvedOpts = {
  labelWidth: 200,
  labelWidthMobile: 140,
  rowHeight: 32,
  rowHeightMobile: 26,
  minDayWidth: 18,
  mobileBreakpoint: 640,
  locale: 'pt-BR',
  todayLabel: 'HOJE',
  headerLabel: 'TAREFAS',
  dragToScroll: true,
  tooltip: true,
  scrollToToday: true,
}

// ── Date helpers ──

function parseDate(s: string): Date {
  const parts = s.split('-').map(Number)
  return new Date(parts[0] ?? 0, (parts[1] ?? 1) - 1, parts[2])
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function formatDate(d: Date, locale: string): string {
  return d
    .toLocaleDateString(locale, { day: '2-digit', month: 'short' })
    .replace('.', '')
}

function formatDateShort(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
}

function getMonthsBetween(start: Date, end: Date): Date[] {
  const months: Date[] = []
  const cur = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cur <= end) {
    months.push(new Date(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

function getWeekStarts(start: Date, end: Date): Date[] {
  const weeks: Date[] = []
  const cur = new Date(start)
  const day = cur.getDay()
  const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day
  cur.setDate(cur.getDate() + diff)
  while (cur <= end) {
    weeks.push(new Date(cur))
    cur.setDate(cur.getDate() + 7)
  }
  return weeks
}

// ── Row model ──

type Row =
  | { type: 'phase'; phase: Phase }
  | { type: 'task'; task: Task; phase: Phase }

function buildRows(phases: Phase[]): Row[] {
  const rows: Row[] = []
  for (const phase of phases) {
    rows.push({ type: 'phase', phase })
    for (const task of phase.tasks) {
      rows.push({ type: 'task', task, phase })
    }
  }
  return rows
}

// ── Tooltip DOM ──

interface TooltipRefs {
  root: HTMLDivElement
  name: HTMLElement
  dates: HTMLElement
  dur: HTMLElement
  dot: HTMLElement
  status: HTMLElement
}

function createTooltipEl(): TooltipRefs {
  const root = document.createElement('div')
  root.className = 'og-tooltip'
  root.innerHTML = `
    <div class="og-tooltip-inner">
      <div class="og-tooltip-name"></div>
      <div class="og-tooltip-dates"></div>
      <div class="og-tooltip-meta">
        <span class="og-tooltip-dot"></span>
        <span class="og-tooltip-status"></span>
        <span class="og-tooltip-dur"></span>
      </div>
    </div>
    <svg class="og-tooltip-arrow" viewBox="0 0 10 6"><path d="M0 0 L5 6 L10 0" fill="rgba(17,17,17,0.92)"/></svg>`

  return {
    root,
    name: root.querySelector('.og-tooltip-name') as HTMLElement,
    dates: root.querySelector('.og-tooltip-dates') as HTMLElement,
    dur: root.querySelector('.og-tooltip-dur') as HTMLElement,
    dot: root.querySelector('.og-tooltip-dot') as HTMLElement,
    status: root.querySelector('.og-tooltip-status') as HTMLElement,
  }
}

// ── Main ──

export function createGantt(
  container: HTMLElement,
  data: GanttData,
  options?: GanttOptions,
): GanttInstance {
  const opts: ResolvedOpts = { ...DEFAULTS, ...options }
  const currentData = { ...data }
  let destroyed = false
  let lastWidth = 0
  let didInitScroll = false
  let rafId: ReturnType<typeof setTimeout> = setTimeout(() => {}, 0)

  // Schedule a callback — prefer rAF but fall back to setTimeout
  // (Obsidian/Electron Bases views don't fire rAF for off-screen panels)
  function schedule(fn: () => void) {
    if (typeof requestAnimationFrame === 'function') {
      let fired = false
      requestAnimationFrame(() => {
        if (!fired) {
          fired = true
          fn()
        }
      })
      // Fallback if rAF never fires (e.g. Obsidian Bases views)
      setTimeout(() => {
        if (!fired) {
          fired = true
          fn()
        }
      }, 50)
    } else {
      setTimeout(fn, 16)
    }
  }

  // Build DOM structure
  const outer = document.createElement('div')
  outer.className = 'og-outer'

  const labelsEl = document.createElement('div')
  labelsEl.className = 'og-labels'

  const scrollEl = document.createElement('div')
  scrollEl.className = 'og-scroll'

  const timelineEl = document.createElement('div')
  timelineEl.className = 'og-timeline'

  scrollEl.appendChild(timelineEl)
  outer.appendChild(labelsEl)
  outer.appendChild(scrollEl)

  const tt = createTooltipEl()
  outer.appendChild(tt.root)

  container.appendChild(outer)

  // ── Responsive helpers ──
  const isMobile = () => container.clientWidth < opts.mobileBreakpoint
  const labelW = () => (isMobile() ? opts.labelWidthMobile : opts.labelWidth)
  const rowH = () => (isMobile() ? opts.rowHeightMobile : opts.rowHeight)
  const phaseRowH = () => (isMobile() ? 24 : 28)

  // ── Core render ──

  function render() {
    try {
      renderInner()
    } catch (err) {
      console.error('[svgantt] render error:', err)
    }
  }

  function renderInner() {
    if (destroyed) return

    const outerWidth = outer.clientWidth
    if (outerWidth <= 0) return // not laid out yet — ResizeObserver will retry
    if (outerWidth === lastWidth && labelsEl.querySelector('svg')) return
    lastWidth = outerWidth

    labelsEl.innerHTML = ''
    timelineEl.innerHTML = ''

    const lw = labelW()
    const rh = rowH()
    const prh = phaseRowH()
    const mob = isMobile()

    const projectStart = parseDate(currentData.projectStart)
    const projectEnd = parseDate(currentData.projectEnd)
    const PS = new Date(
      projectStart.getFullYear(),
      projectStart.getMonth(),
      projectStart.getDate() - 8,
    )
    const PE = new Date(
      projectEnd.getFullYear(),
      projectEnd.getMonth(),
      projectEnd.getDate() + 4,
    )

    const totalDays = daysBetween(PS, PE) + 1
    const availableWidth = outerWidth - lw
    const dayW = Math.max(opts.minDayWidth, availableWidth / totalDays)
    const timelineW = totalDays * dayW

    const rows = buildRows(currentData.phases)
    let totalHeight = HEADER_H + PAD_BOTTOM
    for (const r of rows) totalHeight += r.type === 'phase' ? prh : rh

    const xDay = (s: string) => daysBetween(PS, parseDate(s)) * dayW
    const xDayObj = (d: Date) => daysBetween(PS, d) * dayW

    // ── LEFT SVG ──
    const leftSvg = svg(lw, totalHeight, '#0a0a0a')
    leftSvg.appendChild(
      el('rect', {
        x: 0,
        y: 0,
        width: lw,
        height: totalHeight,
        fill: '#0a0a0a',
      }),
    )
    leftSvg.appendChild(
      el(
        'text',
        {
          x: lw / 2,
          y: 16,
          fill: '#3a3a3a',
          'font-family': FONT_MONO,
          'font-size': mob ? 9 : 10,
          'font-weight': 600,
          'text-anchor': 'middle',
          'letter-spacing': '0.1em',
        },
        opts.headerLabel,
      ),
    )
    leftSvg.appendChild(
      el('line', {
        x1: 0,
        y1: HEADER_H,
        x2: lw,
        y2: HEADER_H,
        stroke: 'rgba(255,255,255,0.06)',
        'stroke-width': 1,
      }),
    )

    // ── RIGHT SVG ──
    const rightSvg = svg(timelineW, totalHeight, 'black')

    const defs = el('defs')
    const glowFilter = el('filter', {
      id: 'og-glow',
      x: '-20%',
      y: '-20%',
      width: '140%',
      height: '140%',
    })
    glowFilter.appendChild(
      el('feDropShadow', {
        dx: 0,
        dy: 0,
        stdDeviation: 3,
        'flood-color': '#fbbf24',
        'flood-opacity': 0.4,
      }),
    )
    defs.appendChild(glowFilter)
    rightSvg.appendChild(defs)

    rightSvg.appendChild(
      el('rect', {
        x: 0,
        y: 0,
        width: timelineW,
        height: totalHeight,
        fill: 'black',
      }),
    )

    // Month headers
    const months = getMonthsBetween(PS, PE)
    months.forEach((monthStart, i) => {
      const monthEnd = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth() + 1,
        0,
      )
      const cs = monthStart < PS ? PS : monthStart
      const ce = monthEnd > PE ? PE : monthEnd
      const x1 = xDayObj(cs)
      const x2 = xDayObj(ce) + dayW
      const w = x2 - x1

      rightSvg.appendChild(
        el('rect', {
          x: x1,
          y: 0,
          width: w,
          height: 24,
          fill:
            i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
        }),
      )
      rightSvg.appendChild(
        el(
          'text',
          {
            x: x1 + w / 2,
            y: 16,
            fill: '#525252',
            'font-family': FONT_MONO,
            'font-size': mob ? 9 : 11,
            'font-weight': 500,
            'text-anchor': 'middle',
            'letter-spacing': '0.05em',
          },
          `${MONTH_NAMES[monthStart.getMonth()] ?? ''} ${monthStart.getFullYear()}`,
        ),
      )

      if (i > 0) {
        rightSvg.appendChild(
          el('line', {
            x1,
            y1: 0,
            x2: x1,
            y2: totalHeight,
            stroke: 'rgba(255,255,255,0.08)',
            'stroke-width': 1,
          }),
        )
      }
    })

    // Week grid
    const weeks = getWeekStarts(PS, PE)
    for (const ws of weeks) {
      const x = xDayObj(ws)
      rightSvg.appendChild(
        el('line', {
          x1: x,
          y1: HEADER_H,
          x2: x,
          y2: totalHeight,
          stroke: 'rgba(255,255,255,0.03)',
          'stroke-width': 1,
        }),
      )
      if (dayW * 7 > 20) {
        rightSvg.appendChild(
          el(
            'text',
            {
              x: x + dayW * 3.5,
              y: 38,
              fill: '#3a3a3a',
              'font-family': FONT_MONO,
              'font-size': mob ? 8 : 9,
              'text-anchor': 'middle',
            },
            formatDateShort(ws, opts.locale),
          ),
        )
      }
    }

    // Header lines
    rightSvg.appendChild(
      el('line', {
        x1: 0,
        y1: 24,
        x2: timelineW,
        y2: 24,
        stroke: 'rgba(255,255,255,0.05)',
        'stroke-width': 1,
      }),
    )
    rightSvg.appendChild(
      el('line', {
        x1: 0,
        y1: HEADER_H,
        x2: timelineW,
        y2: HEADER_H,
        stroke: 'rgba(255,255,255,0.06)',
        'stroke-width': 1,
      }),
    )

    // ── ROWS ──
    interface BarInfo {
      el: SVGElement
      barEl: SVGElement
      task: Task
      barX: number
      barY: number
      barW: number
      barH: number
      phase: Phase
    }
    const barRects: BarInfo[] = []
    let y = HEADER_H
    let taskIdx = 0

    for (const row of rows) {
      const h = row.type === 'phase' ? prh : rh

      if (row.type === 'phase') {
        // Phase row
        leftSvg.appendChild(
          el('rect', {
            x: 0,
            y,
            width: lw,
            height: h,
            fill: row.phase.accent,
            opacity: 0.06,
          }),
        )
        leftSvg.appendChild(
          el('rect', { x: 0, y, width: 3, height: h, fill: row.phase.accent }),
        )
        leftSvg.appendChild(
          el(
            'text',
            {
              x: 12,
              y: y + h / 2 + 1,
              fill: row.phase.accent,
              'font-family': FONT_MONO,
              'font-size': mob ? 9 : 10,
              'font-weight': 600,
              'letter-spacing': '0.08em',
              'dominant-baseline': 'central',
            },
            row.phase.name.toUpperCase(),
          ),
        )

        rightSvg.appendChild(
          el('rect', {
            x: 0,
            y,
            width: timelineW,
            height: h,
            fill: row.phase.accent,
            opacity: 0.06,
          }),
        )
      } else {
        const { task, phase } = row
        const sc = STATUS_COLORS[task.status]

        // Alternating stripe
        if (taskIdx % 2 === 1) {
          leftSvg.appendChild(
            el('rect', {
              x: 0,
              y,
              width: lw,
              height: h,
              fill: 'rgba(255,255,255,0.015)',
            }),
          )
          rightSvg.appendChild(
            el('rect', {
              x: 0,
              y,
              width: timelineW,
              height: h,
              fill: 'rgba(255,255,255,0.015)',
            }),
          )
        }
        taskIdx++

        // Row lines
        leftSvg.appendChild(
          el('line', {
            x1: 0,
            y1: y,
            x2: lw,
            y2: y,
            stroke: 'rgba(255,255,255,0.04)',
            'stroke-width': 1,
          }),
        )
        rightSvg.appendChild(
          el('line', {
            x1: 0,
            y1: y,
            x2: timelineW,
            y2: y,
            stroke: 'rgba(255,255,255,0.04)',
            'stroke-width': 1,
          }),
        )

        // Status dot
        const dotR = 3.5
        const dotCx = 14 + dotR
        const dotCy = y + h / 2
        if (task.status === 'planned') {
          leftSvg.appendChild(
            el('circle', {
              cx: dotCx,
              cy: dotCy,
              r: dotR,
              fill: 'none',
              stroke: '#737373',
              'stroke-width': 1,
              'stroke-dasharray': '2,1.5',
              opacity: 0.7,
            }),
          )
        } else if (task.status === 'next') {
          leftSvg.appendChild(
            el('circle', {
              cx: dotCx,
              cy: dotCy,
              r: dotR,
              fill: sc.fill,
              opacity: 0.4,
            }),
          )
        } else {
          leftSvg.appendChild(
            el('circle', {
              cx: dotCx,
              cy: dotCy,
              r: dotR,
              fill: sc.fill,
              opacity: 0.85,
            }),
          )
        }

        // Label
        const labelX = dotCx + dotR + 6
        const truncName =
          mob && task.name.length > 14
            ? `${task.name.slice(0, 13)}\u2026`
            : task.name
        leftSvg.appendChild(
          el(
            'text',
            {
              x: labelX,
              y: y + h / 2,
              fill: '#737373',
              'font-family': FONT_SANS,
              'font-size': mob ? 10 : 13,
              'font-weight': 500,
              'dominant-baseline': 'central',
            },
            truncName,
          ),
        )

        // Bar
        const barX = xDay(task.start)
        const barEndX = xDay(task.end) + dayW
        const barW = Math.max(barEndX - barX, 4)
        const barH = mob ? 14 : 18
        const barY = y + (h - barH) / 2

        const barAttrs: Record<string, string | number> = {
          x: barX,
          y: barY,
          width: barW,
          height: barH,
          rx: 4,
          ry: 4,
        }

        if (task.status === 'planned') {
          barAttrs.fill = 'none'
          barAttrs.stroke = '#737373'
          barAttrs['stroke-width'] = 1.5
          barAttrs['stroke-dasharray'] = '4,3'
          barAttrs.opacity = 0.5
        } else {
          barAttrs.fill = sc.fill
          barAttrs.opacity = sc.opacity
        }
        if (task.status === 'active') barAttrs.filter = 'url(#og-glow)'

        const barEl = el('rect', barAttrs)
        rightSvg.appendChild(barEl)

        // Bar label
        const fontSize = mob ? 9 : 12
        const estLabelW = task.name.length * (fontSize * 0.58) + 12
        if (barW > estLabelW) {
          const clipId = `og-c-${taskIdx}`
          const clip = el('clipPath', { id: clipId })
          clip.appendChild(
            el('rect', {
              x: barX + 6,
              y: barY,
              width: barW - 12,
              height: barH,
            }),
          )
          defs.appendChild(clip)
          rightSvg.appendChild(
            el(
              'text',
              {
                x: barX + barW / 2,
                y: barY + barH / 2,
                fill:
                  task.status === 'planned'
                    ? '#8a8a8a'
                    : task.status === 'next'
                      ? '#c4d6f5'
                      : '#fff',
                'font-family': FONT_SANS,
                'font-size': fontSize,
                'font-weight': 600,
                'text-anchor': 'middle',
                'dominant-baseline': 'central',
                'clip-path': `url(#${clipId})`,
                opacity:
                  task.status === 'planned'
                    ? 0.6
                    : task.status === 'next'
                      ? 0.8
                      : 1,
              },
              task.name,
            ),
          )
        } else {
          rightSvg.appendChild(
            el(
              'text',
              {
                x: barX + barW + 8,
                y: barY + barH / 2,
                fill: '#737373',
                'font-family': FONT_SANS,
                'font-size': fontSize,
                'font-weight': 500,
                'text-anchor': 'start',
                'dominant-baseline': 'central',
              },
              task.name,
            ),
          )
        }

        // Hover rect
        const hoverRect = el('rect', {
          x: barX,
          y: barY,
          width: barW,
          height: barH,
          fill: 'transparent',
          style: 'cursor:pointer;',
        })
        rightSvg.appendChild(hoverRect)
        barRects.push({
          el: hoverRect,
          barEl,
          task,
          barX,
          barY,
          barW,
          barH,
          phase,
        })
      }

      y += h
    }

    // ── Milestones ──
    for (const ms of currentData.milestones) {
      const x = xDay(ms.date)
      rightSvg.appendChild(
        el('line', {
          x1: x,
          y1: HEADER_H,
          x2: x,
          y2: totalHeight,
          stroke: ms.color,
          'stroke-width': 1.5,
          'stroke-dasharray': '4,3',
          opacity: 0.45,
        }),
      )
      const dy = HEADER_H
      rightSvg.appendChild(
        el('polygon', {
          points: `${x},${dy - 6} ${x + 5},${dy} ${x},${dy + 6} ${x - 5},${dy}`,
          fill: ms.color,
          opacity: 0.65,
        }),
      )
      const msLabelW = ms.name.length * 5.5 + 14
      rightSvg.appendChild(
        el('rect', {
          x: x - msLabelW / 2,
          y: 25,
          width: msLabelW,
          height: 16,
          rx: 3,
          ry: 3,
          fill: '#050505',
          stroke: ms.color,
          'stroke-width': 0.75,
          opacity: 0.9,
        }),
      )
      rightSvg.appendChild(
        el(
          'text',
          {
            x,
            y: 35.5,
            fill: ms.color,
            'font-family': FONT_MONO,
            'font-size': 8,
            'font-weight': 600,
            'text-anchor': 'middle',
            opacity: 0.9,
          },
          ms.name,
        ),
      )
    }

    // ── Today line ──
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let todayX = -1
    if (today >= PS && today <= PE) {
      todayX = xDayObj(today)
      rightSvg.appendChild(
        el('line', {
          x1: todayX,
          y1: 24,
          x2: todayX,
          y2: totalHeight,
          stroke: '#ef4444',
          'stroke-width': 2,
          opacity: 0.55,
        }),
      )
      const hojeW = 38
      rightSvg.appendChild(
        el('rect', {
          x: todayX - hojeW / 2,
          y: 26,
          width: hojeW,
          height: 15,
          rx: 7.5,
          ry: 7.5,
          fill: '#ef4444',
          opacity: 0.9,
        }),
      )
      rightSvg.appendChild(
        el(
          'text',
          {
            x: todayX,
            y: 36,
            fill: '#fff',
            'font-family': FONT_MONO,
            'font-size': 8,
            'font-weight': 700,
            'text-anchor': 'middle',
          },
          opts.todayLabel,
        ),
      )
    }

    // Bottom lines
    leftSvg.appendChild(
      el('line', {
        x1: 0,
        y1: totalHeight - 1,
        x2: lw,
        y2: totalHeight - 1,
        stroke: 'rgba(255,255,255,0.06)',
        'stroke-width': 1,
      }),
    )
    rightSvg.appendChild(
      el('line', {
        x1: 0,
        y1: totalHeight - 1,
        x2: timelineW,
        y2: totalHeight - 1,
        stroke: 'rgba(255,255,255,0.06)',
        'stroke-width': 1,
      }),
    )

    // Mount
    labelsEl.appendChild(leftSvg)
    timelineEl.appendChild(rightSvg)

    // Auto-scroll to today
    if (!didInitScroll && todayX >= 0 && opts.scrollToToday) {
      scrollEl.scrollLeft = Math.max(0, todayX - availableWidth / 2)
      didInitScroll = true
    }

    // ── Tooltip events ──
    if (opts.tooltip) {
      for (const item of barRects) {
        const sc = STATUS_COLORS[item.task.status]

        item.el.addEventListener('mouseenter', () => {
          if (item.task.status !== 'planned') {
            item.barEl.setAttribute(
              'opacity',
              String(Math.min(sc.opacity + 0.15, 1)),
            )
          } else {
            item.barEl.setAttribute('opacity', '0.65')
          }

          tt.name.textContent = item.task.name
          const startD = parseDate(item.task.start)
          const endD = parseDate(item.task.end)
          tt.dates.textContent = `${formatDate(startD, opts.locale)} \u2192 ${formatDate(endD, opts.locale)}`
          const dur = daysBetween(startD, endD) + 1
          tt.dur.textContent = `${dur} dias`

          if (sc.dotBorder) {
            tt.dot.style.background = 'transparent'
            tt.dot.style.border = `1.5px solid ${sc.dotBorder}`
          } else {
            tt.dot.style.background = sc.fill
            tt.dot.style.border = 'none'
          }
          tt.status.textContent = sc.label

          tt.root.style.left = '0px'
          tt.root.style.top = '-9999px'
          tt.root.classList.add('visible')

          const outerRect = outer.getBoundingClientRect()
          const barRect = item.el.getBoundingClientRect()
          const ttRect = tt.root.getBoundingClientRect()

          let left =
            barRect.left + barRect.width / 2 - outerRect.left - ttRect.width / 2
          const top = barRect.top - outerRect.top - ttRect.height - 6
          if (left < 4) left = 4
          if (left + ttRect.width > outer.clientWidth - 4)
            left = outer.clientWidth - ttRect.width - 4

          tt.root.style.left = `${left}px`
          tt.root.style.top = `${Math.max(0, top)}px`
        })

        item.el.addEventListener('mouseleave', () => {
          item.barEl.setAttribute(
            'opacity',
            String(item.task.status === 'planned' ? 0.5 : sc.opacity),
          )
          tt.root.classList.remove('visible')
        })
      }
    }
  }

  // ── Drag-to-scroll ──
  let isDragging = false
  let dragStartX = 0
  let dragScrollLeft = 0

  function onMouseDown(e: MouseEvent) {
    if (!opts.dragToScroll) return
    if ((e.target as HTMLElement).closest('[style*="cursor"]')) return
    isDragging = true
    dragStartX = e.pageX - scrollEl.offsetLeft
    dragScrollLeft = scrollEl.scrollLeft
    scrollEl.classList.add('og-dragging')
  }
  function onMouseUp() {
    isDragging = false
    scrollEl.classList.remove('og-dragging')
  }
  function onMouseMove(e: MouseEvent) {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - scrollEl.offsetLeft
    scrollEl.scrollLeft = dragScrollLeft - (x - dragStartX) * 1.5
  }

  scrollEl.addEventListener('mousedown', onMouseDown)
  scrollEl.addEventListener('mouseleave', onMouseUp)
  scrollEl.addEventListener('mouseup', onMouseUp)
  scrollEl.addEventListener('mousemove', onMouseMove)

  // ── Resize observer ──
  function onResize() {
    clearTimeout(rafId)
    rafId = setTimeout(() => {
      lastWidth = 0
      didInitScroll = false
      render()
    }, 16)
  }

  const ro = new ResizeObserver(onResize)
  ro.observe(container)
  ro.observe(outer)

  // Initial render
  schedule(render)

  // ── Public API ──
  return {
    update(partial) {
      Object.assign(currentData, partial)
      lastWidth = 0
      schedule(render)
    },
    scrollToToday() {
      didInitScroll = false
      lastWidth = 0
      render()
    },
    refresh() {
      lastWidth = 0
      schedule(render)
    },
    destroy() {
      destroyed = true
      ro.disconnect()
      scrollEl.removeEventListener('mousedown', onMouseDown)
      scrollEl.removeEventListener('mouseleave', onMouseUp)
      scrollEl.removeEventListener('mouseup', onMouseUp)
      scrollEl.removeEventListener('mousemove', onMouseMove)
      clearTimeout(rafId)
      outer.remove()
    },
  }
}
