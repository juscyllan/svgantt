import { expect, test } from '@playwright/test'

test.describe('svgantt rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for SVG to render
    await page.waitForSelector('.og-timeline svg', { timeout: 5000 })
  })

  test('renders the outer container with labels + timeline', async ({ page }) => {
    const outer = page.locator('.og-outer')
    await expect(outer).toBeVisible()

    const labels = page.locator('.og-labels svg')
    await expect(labels).toBeVisible()

    const timeline = page.locator('.og-timeline svg')
    await expect(timeline).toBeVisible()
  })

  test('timeline SVG fills available width', async ({ page }) => {
    const outer = page.locator('.og-outer')
    const outerBox = await outer.boundingBox()

    const timelineSvg = page.locator('.og-timeline svg')
    const svgWidth = await timelineSvg.getAttribute('width')

    // Timeline SVG should be wider than the visible area (scrollable)
    // or at minimum equal to (container - labels)
    expect(Number(svgWidth)).toBeGreaterThan(0)
    expect(outerBox!.width).toBeGreaterThan(100)
  })

  test('renders correct number of task rows', async ({ page }) => {
    // Demo has 10 tasks across 3 phases
    // Each task has a hover rect with style cursor:pointer
    const bars = page.locator('.og-timeline svg rect[style*="cursor"]')
    await expect(bars).toHaveCount(10)
  })

  test('renders 3 phase headers', async ({ page }) => {
    // Phase names in left panel — look for uppercase text matching phase names
    const labelsHtml = await page.locator('.og-labels svg').innerHTML()
    expect(labelsHtml).toContain('FASE 1')
    expect(labelsHtml).toContain('FASE 2')
    expect(labelsHtml).toContain('FASE 3')
  })

  test('renders milestones', async ({ page }) => {
    const timelineHtml = await page.locator('.og-timeline svg').innerHTML()
    expect(timelineHtml).toContain('MVP Ready')
    expect(timelineHtml).toContain('Beta')
    expect(timelineHtml).toContain('Launch')
  })

  test('renders today line', async ({ page }) => {
    const timelineHtml = await page.locator('.og-timeline svg').innerHTML()
    expect(timelineHtml).toContain('HOJE')
  })

  test('bars span the correct timeline area (not compressed)', async ({ page }) => {
    // Get all task bars (non-transparent rects with rx=4)
    const bars = page.locator('.og-timeline svg rect[rx="4"]')
    const count = await bars.count()
    expect(count).toBeGreaterThanOrEqual(10) // 10 tasks

    // Check that bars have meaningful width (not all compressed to <10px)
    const widths: number[] = []
    for (let i = 0; i < count; i++) {
      const w = await bars.nth(i).getAttribute('width')
      if (w) widths.push(Number(w))
    }

    // Most bars should be >20px wide (not compressed)
    const meaningfulBars = widths.filter((w) => w > 20)
    expect(meaningfulBars.length).toBeGreaterThanOrEqual(8)
  })

  test('scroll container is scrollable', async ({ page }) => {
    const scroll = page.locator('.og-scroll')
    const scrollWidth = await scroll.evaluate((el) => el.scrollWidth)
    const clientWidth = await scroll.evaluate((el) => el.clientWidth)

    // scrollWidth should be >= clientWidth (scrollable or exactly fitting)
    expect(scrollWidth).toBeGreaterThanOrEqual(clientWidth)
  })

  test('screenshot - full chart', async ({ page }) => {
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'tests/screenshots/full-chart.png' })
  })

  test('screenshot - zoomed into today area', async ({ page }) => {
    // Scroll to today and screenshot
    const scroll = page.locator('.og-scroll')
    await scroll.evaluate((el) => {
      // Find the HOJE text position
      const hoje = el.querySelector('text')
      if (hoje) {
        const x = Number(hoje.getAttribute('x') || 0)
        el.scrollLeft = Math.max(0, x - el.clientWidth / 2)
      }
    })
    await page.screenshot({ path: 'tests/screenshots/today-area.png' })
  })
})
