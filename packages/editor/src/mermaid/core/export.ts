/**
 * Diagram export helpers — pure functions over the source string and the
 * rendered SVG string, using only browser APIs (Clipboard, Blob, `<canvas>`), so
 * the surface adds **no** new dependency. Each returns a promise that resolves on
 * success and rejects on failure, so the caller can report the outcome inline.
 */

/** Copy arbitrary text (the diagram source) to the clipboard. */
export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/** Copy the rendered SVG markup to the clipboard as text. */
export async function copySvg(svg: string): Promise<void> {
  await navigator.clipboard.writeText(svg);
}

/** Trigger a download of `content` as a file. */
function download(content: Blob, filename: string): void {
  const url = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Download the rendered SVG as an `.svg` file. */
export function downloadSvg(svg: string, filename = 'diagram.svg'): void {
  download(new Blob([svg], { type: 'image/svg+xml' }), filename);
}

/**
 * Rasterize the rendered SVG to a PNG via an offscreen `<canvas>` and download
 * it. `scale` multiplies the intrinsic size for a higher-DPI export. Fonts drawn
 * through SVG `foreignObject` can vary by browser — the SVG paths are the
 * lossless export.
 */
export async function downloadPng(
  svg: string,
  filename = 'diagram.png',
  scale = 2,
): Promise<void> {
  const image = new Image();
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Failed to load SVG for PNG export'));
      image.src = svgUrl;
    });
    const width = (image.naturalWidth || image.width) * scale;
    const height = (image.naturalHeight || image.height) * scale;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context unavailable');
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) throw new Error('Failed to encode PNG');
    download(blob, filename);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
