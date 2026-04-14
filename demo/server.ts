import index from './index.html'
import obsidianTest from './obsidian-test.html'

Bun.serve({
  port: 9998,
  routes: {
    '/': index,
    '/obsidian': obsidianTest,
  },
  development: {
    hmr: true,
    console: true,
  },
})

console.log('Demo running at http://localhost:9998')
console.log('Obsidian test at http://localhost:9998/obsidian')
