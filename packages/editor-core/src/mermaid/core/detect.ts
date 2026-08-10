import type { DiagramType } from './types.js';

/**
 * Detect a Mermaid diagram's type from its source by matching the first
 * non-empty line against each kind's opening keyword — pure, engine-free, so it
 * runs off-runtime (the surface's toolbar label + the block header both use it).
 */
const KEYWORDS: readonly [RegExp, DiagramType][] = [
  [/^(graph|flowchart)\b/, 'flowchart'],
  [/^sequenceDiagram\b/, 'sequence'],
  [/^classDiagram(-v2)?\b/, 'class'],
  [/^stateDiagram(-v2)?\b/, 'state'],
  [/^erDiagram\b/, 'er'],
  [/^gantt\b/, 'gantt'],
  [/^pie\b/, 'pie'],
  [/^mindmap\b/, 'mindmap'],
  [/^gitGraph\b/, 'gitGraph'],
  [/^journey\b/, 'journey'],
  [/^timeline\b/, 'timeline'],
  [/^quadrantChart\b/, 'quadrant'],
];

/** Map a `DiagramType` to a human label for the toolbar/header. */
export const DIAGRAM_TYPE_LABEL: Record<DiagramType, string> = {
  flowchart: 'Flowchart',
  sequence: 'Sequence',
  class: 'Class',
  state: 'State',
  er: 'Entity Relationship',
  gantt: 'Gantt',
  pie: 'Pie',
  mindmap: 'Mindmap',
  gitGraph: 'Git Graph',
  journey: 'Journey',
  timeline: 'Timeline',
  quadrant: 'Quadrant',
  unknown: 'Diagram',
};

/** The detected `DiagramType` of `source`, or `'unknown'` when no keyword matches. */
export function detectDiagramType(source: string): DiagramType {
  const firstLine =
    source
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? '';
  for (const [pattern, type] of KEYWORDS) {
    if (pattern.test(firstLine)) return type;
  }
  return 'unknown';
}
