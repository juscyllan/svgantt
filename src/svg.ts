const NS = 'http://www.w3.org/2000/svg';

export function el(tag: string, attrs?: Record<string, string | number>, text?: string): SVGElement {
  const node = document.createElementNS(NS, tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      node.setAttribute(k, String(v));
    }
  }
  if (text !== undefined) node.textContent = text;
  return node;
}

export function svg(width: number, height: number, bg: string): SVGSVGElement {
  return el('svg', {
    width,
    height,
    xmlns: NS,
    style: `background:${bg};`,
  }) as SVGSVGElement;
}
