import type { MermaidRenderResult, RenderThemeConfig } from './types.js';

/**
 * The lazy Mermaid engine seam. The heavy `mermaid` engine is `import()`ed only
 * here, only in the browser, only when a diagram renders — it is never imported
 * at module load, and its type never reaches a public signature (engine-hiding).
 * `render` parses first so a syntax error is caught cleanly instead of throwing
 * a partial render.
 */

/** Pull a 1-based line number out of a Mermaid parse-error message, if present. */
function parseErrorLine(message: string): number | undefined {
  const match = /line\s+(\d+)/i.exec(message);
  return match ? Number(match[1]) : undefined;
}

/**
 * Render `source` to an SVG string under `theme`. Returns a discriminated result
 * (`ok` + `svg`, or `ok: false` + `error`/`line`) — never throws — so callers can
 * keep the last good render on failure.
 */
export async function renderDiagram(
  id: string,
  source: string,
  theme: RenderThemeConfig,
): Promise<MermaidRenderResult> {
  try {
    // Lazy import keeps the large engine out of the base bundle and its type out
    // of the public surface; the config type is only known behind this import, so
    // the theme id is widened here.
    const mermaidEngine = (await import('mermaid')).default;
    mermaidEngine.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: theme.theme as never,
      themeVariables: theme.themeVariables,
    });
    await mermaidEngine.parse(source);
    const { svg } = await mermaidEngine.render(id, source);
    return { ok: true, svg };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message, line: parseErrorLine(message) };
  }
}
