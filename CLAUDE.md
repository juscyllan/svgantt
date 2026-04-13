# svgantt

Zero-dependency SVG Gantt chart. Dark-first, framework-agnostic.

## Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict, tsgo)
- **Lint:** Biome (single quotes, no semicolons)
- **Output:** ESM + CJS + CSS
- **Build:** `bun run build` (scripts/build.ts)
- **Dependencies:** zero (DOM-only)

## Architecture

```
src/
  types.ts      — public types (Task, Phase, Milestone, GanttData, GanttOptions, GanttInstance)
  constants.ts  — status colors, sizing, fonts
  svg.ts        — SVG element factory (el, svg)
  gantt.ts      — core renderer: createGantt(container, data, options?)
  gantt.css     — base styles (tooltip, scrollbar, layout)
  index.ts      — public exports
```

## API

```typescript
import { createGantt } from 'svgantt'
import 'svgantt/styles'

const gantt = createGantt(containerEl, {
  phases: [{ name: 'Phase 1', accent: '#60a5fa', tasks: [...] }],
  milestones: [{ name: 'Launch', date: '2026-06-01', color: '#34d399' }],
  projectStart: '2026-03-01',
  projectEnd: '2026-08-15',
})

gantt.update({ phases: newPhases })
gantt.scrollToToday()
gantt.refresh()
gantt.destroy()
```

## Design origin

Extracted from `jusc.dev` GanttChart.astro. Dark theme, 4 status states (done/active/next/planned), split-panel sticky labels, milestones, today line, drag-to-scroll, hover tooltips.
