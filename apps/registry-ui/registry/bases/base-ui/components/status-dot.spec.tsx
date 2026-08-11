import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { StatusDot } from './status-dot';

afterEach(cleanup);

const cls = (node: ChildNode | null) => (node as HTMLElement).className;

describe('StatusDot', () => {
  it('uses the success token when online', () => {
    const { container } = render(<StatusDot tone="online" />);
    expect(cls(container.firstChild)).toContain('bg-success');
  });

  it('uses a muted token when offline', () => {
    const { container } = render(<StatusDot tone="offline" />);
    expect(cls(container.firstChild)).toContain('bg-muted-foreground');
  });

  it('uses the destructive token when busy', () => {
    const { container } = render(<StatusDot tone="busy" />);
    expect(cls(container.firstChild)).toContain('bg-destructive');
  });

  it('animates when pulse is set', () => {
    const { container } = render(<StatusDot tone="idle" pulse />);
    expect(cls(container.firstChild)).toContain('animate-pulse');
  });

  it('merges a passed className', () => {
    const { container } = render(
      <StatusDot tone="online" className="size-1.5" />,
    );
    expect(cls(container.firstChild)).toContain('size-1.5');
  });
});
