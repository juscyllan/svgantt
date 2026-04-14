import '../src/gantt.css'
import { createGantt } from '../src/index.ts'
import type { GanttData } from '../src/index.ts'

// Exact data extracted from Obsidian Bases via eval — 2026-04-13
const data: GanttData = {
  phases: [
    {
      name: 'Projects',
      accent: '#60a5fa',
      tasks: [
        { name: 'Cartola', start: '2026-03-01', end: '2026-04-30', status: 'active' },
        { name: 'Cartola (mock)', start: '2026-03-01', end: '2026-06-30', status: 'active' },
        { name: 'Cartola Fase 1 (mock)', start: '2026-03-01', end: '2026-04-15', status: 'active' },
        { name: 'Cartola Fase 2 (mock)', start: '2026-05-01', end: '2026-06-30', status: 'next' },
        { name: 'Kujhy-Chief of Staff Bot', start: '2026-04-01', end: '2026-04-08', status: 'done' },
        { name: 'Otto ETE', start: '2025-11-04', end: '2026-08-03', status: 'active' },
        { name: 'Roadmap Otto ETE 2026', start: '2025-10-01', end: '2026-08-03', status: 'active' },
        { name: 'roadmap-2026', start: '2026-03-25', end: '2026-12-31', status: 'active' },
        { name: 'SuperHub', start: '2025-08-01', end: '2026-07-03', status: 'active' },
        { name: 'SuperHub (mock)', start: '2026-02-15', end: '2026-08-15', status: 'active' },
        { name: 'SuperHub M1 (mock)', start: '2026-02-15', end: '2026-05-15', status: 'active' },
        { name: 'SuperHub M2 (mock)', start: '2026-05-15', end: '2026-08-15', status: 'planned' },
        { name: 'Voe Sem Asas', start: '2026-03-01', end: '2026-05-12', status: 'active' },
      ],
    },
  ],
  milestones: [],
  projectStart: '2025-08-01',
  projectEnd: '2026-12-31',
}

const el = document.getElementById('chart')
if (el) {
  const gantt = createGantt(el, data)
  console.log('Gantt created with', data.phases[0]!.tasks.length, 'tasks')
  console.log('Bounds:', data.projectStart, '→', data.projectEnd)

  // Log container dimensions after render
  requestAnimationFrame(() => {
    const outer = el.querySelector('.og-outer') as HTMLElement
    const scroll = el.querySelector('.og-scroll') as HTMLElement
    const timeline = el.querySelector('.og-timeline') as HTMLElement
    if (outer) console.log('outer:', outer.clientWidth, 'x', outer.clientHeight)
    if (scroll) console.log('scroll:', scroll.clientWidth, 'scrollWidth:', scroll.scrollWidth)
    if (timeline) console.log('timeline:', timeline.clientWidth)
    const svg = timeline?.querySelector('svg')
    if (svg) console.log('SVG width attr:', svg.getAttribute('width'), 'viewBox:', svg.getAttribute('viewBox'))
  })
}
