import type { DiagramTemplate, DiagramType } from './types.js';

/**
 * Starter sources per diagram kind — a known-good example the surface's template
 * picker inserts so a user can begin from a working diagram. Pure data,
 * engine-free.
 */
export const DIAGRAM_TEMPLATES: readonly DiagramTemplate[] = [
  {
    type: 'flowchart',
    label: 'Flowchart',
    source: 'flowchart TD\n  A[Start] --> B{OK?}\n  B -->|yes| C[Do]\n  B -->|no| D[Stop]',
  },
  {
    type: 'sequence',
    label: 'Sequence',
    source: 'sequenceDiagram\n  participant A as Alice\n  participant B as Bob\n  A->>B: Hello\n  B-->>A: Hi',
  },
  {
    type: 'class',
    label: 'Class',
    source: 'classDiagram\n  class Animal {\n    +String name\n    +move()\n  }\n  Animal <|-- Dog',
  },
  {
    type: 'state',
    label: 'State',
    source: 'stateDiagram-v2\n  [*] --> Idle\n  Idle --> Running: start\n  Running --> [*]: stop',
  },
  {
    type: 'er',
    label: 'Entity Relationship',
    source: 'erDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER ||--|{ LINE_ITEM : contains',
  },
  {
    type: 'gantt',
    label: 'Gantt',
    source: 'gantt\n  title Plan\n  dateFormat YYYY-MM-DD\n  section Build\n  Task A :a1, 2026-01-01, 5d',
  },
  {
    type: 'pie',
    label: 'Pie',
    source: 'pie title Share\n  "A" : 40\n  "B" : 35\n  "C" : 25',
  },
  {
    type: 'mindmap',
    label: 'Mindmap',
    source: 'mindmap\n  root((Idea))\n    Branch A\n    Branch B',
  },
  {
    type: 'gitGraph',
    label: 'Git Graph',
    source: 'gitGraph\n  commit\n  branch feature\n  commit\n  checkout main\n  merge feature',
  },
];

/** The default starter source (also the block's schema default). */
export const DEFAULT_DIAGRAM_SOURCE = DIAGRAM_TEMPLATES[0].source;

/** Look up a template by diagram type. */
export function templateFor(type: DiagramType): DiagramTemplate | undefined {
  return DIAGRAM_TEMPLATES.find((template) => template.type === type);
}
