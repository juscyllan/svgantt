import '../src/gantt.css'
import { createGantt } from '../src/index.ts'

const data = {
  phases: [
    {
      name: 'Fase 1 — Fundação',
      accent: '#60a5fa',
      tasks: [
        { name: 'Setup infra', start: '2026-03-01', end: '2026-03-14', status: 'done' as const },
        { name: 'Auth + DB', start: '2026-03-10', end: '2026-03-28', status: 'done' as const },
        { name: 'API core', start: '2026-03-20', end: '2026-04-10', status: 'active' as const },
        { name: 'Testes E2E', start: '2026-04-05', end: '2026-04-20', status: 'next' as const },
      ],
    },
    {
      name: 'Fase 2 — Features',
      accent: '#f472b6',
      tasks: [
        { name: 'Dashboard', start: '2026-04-15', end: '2026-05-15', status: 'next' as const },
        { name: 'WhatsApp integration', start: '2026-05-01', end: '2026-06-01', status: 'planned' as const },
        { name: 'Billing', start: '2026-05-15', end: '2026-06-15', status: 'planned' as const },
        { name: 'Mobile app', start: '2026-06-01', end: '2026-07-15', status: 'planned' as const },
      ],
    },
    {
      name: 'Fase 3 — Launch',
      accent: '#34d399',
      tasks: [
        { name: 'Beta testing', start: '2026-07-01', end: '2026-07-31', status: 'planned' as const },
        { name: 'Go-live', start: '2026-08-01', end: '2026-08-15', status: 'planned' as const },
      ],
    },
  ],
  milestones: [
    { name: 'MVP Ready', date: '2026-04-20', color: '#fbbf24' },
    { name: 'Beta', date: '2026-07-01', color: '#60a5fa' },
    { name: 'Launch', date: '2026-08-15', color: '#34d399' },
  ],
  projectStart: '2026-03-01',
  projectEnd: '2026-08-15',
}

const el = document.getElementById('chart')
if (el) {
  createGantt(el, data)
}
