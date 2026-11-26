import { describe, expect, it } from 'vitest';
import { detectDiagramType } from './detect.js';

describe('detectDiagramType', () => {
  it.each([
    ['graph TD\n  A-->B', 'flowchart'],
    ['flowchart LR\n  A-->B', 'flowchart'],
    ['sequenceDiagram\n  A->>B: hi', 'sequence'],
    ['classDiagram\n  class A', 'class'],
    ['stateDiagram-v2\n  [*]-->A', 'state'],
    ['erDiagram\n  A ||--o{ B : x', 'er'],
    ['gantt\n  title X', 'gantt'],
    ['pie title X', 'pie'],
    ['mindmap\n  root', 'mindmap'],
    ['gitGraph\n  commit', 'gitGraph'],
  ] as const)('detects %s as %s', (source, type) => {
    expect(detectDiagramType(source)).toBe(type);
  });

  it('ignores leading blank lines', () => {
    expect(detectDiagramType('\n\n  sequenceDiagram\n  A->>B: hi')).toBe('sequence');
  });

  it('returns "unknown" for unrecognized or empty source', () => {
    expect(detectDiagramType('hello world')).toBe('unknown');
    expect(detectDiagramType('')).toBe('unknown');
  });
});
