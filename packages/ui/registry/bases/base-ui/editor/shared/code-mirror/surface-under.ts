type Rgba = [red: number, green: number, blue: number, alpha: number];

const RGB = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/;

let probe: CanvasRenderingContext2D | null | undefined;

/** A computed CSS colour as sRGB channels; the browser's canvas reads the forms (oklch, color-mix) a regex cannot. */
function channelsOf(color: string): Rgba | null {
  const match = RGB.exec(color);
  if (match) {
    const alpha = match[4] === undefined ? 1 : match[4].endsWith('%') ? parseFloat(match[4]) / 100 : Number(match[4]);
    return [Number(match[1]), Number(match[2]), Number(match[3]), alpha];
  }
  if (probe === undefined) {
    try {
      probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    } catch {
      probe = null;
    }
  }
  if (!probe) return null;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = probe.getImageData(0, 0, 1, 1).data;
  return [red, green, blue, alpha / 255];
}

/**
 * The opaque colour a reader sees behind `element`: its ancestors' backgrounds composited from the
 * nearest opaque one, or the page's own when none is. `null` when no ancestor paints anything readable.
 */
export function surfaceUnder(element: HTMLElement): string | null {
  const layers: Rgba[] = [];
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    const channels = channelsOf(getComputedStyle(node).backgroundColor);
    if (!channels || channels[3] === 0) continue;
    layers.push(channels);
    if (channels[3] >= 1) break;
  }
  if (layers.length === 0) return null;
  let [red, green, blue] = layers[layers.length - 1][3] >= 1 ? layers[layers.length - 1] : [255, 255, 255];
  for (let index = layers[layers.length - 1][3] >= 1 ? layers.length - 2 : layers.length - 1; index >= 0; index--) {
    const [r, g, b, a] = layers[index];
    red = r * a + red * (1 - a);
    green = g * a + green * (1 - a);
    blue = b * a + blue * (1 - a);
  }
  return `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;
}
