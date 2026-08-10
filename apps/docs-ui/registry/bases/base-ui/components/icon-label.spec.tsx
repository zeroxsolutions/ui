import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { IconLabel } from './icon-label';

beforeAll(() => {
  // Base UI's tooltip positioning needs ResizeObserver, absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

function Star({ className }: { className?: string }) {
  return <svg data-testid="star" className={className} />;
}

describe('IconLabel', () => {
  it('renders the icon at the compact glyph size inside the tooltip trigger', () => {
    const { getByTestId } = render(<IconLabel icon={Star} tooltip="Rotation" />);
    const icon = getByTestId('star');
    expect(icon).toBeTruthy();
    expect(icon.getAttribute('class')).toContain('size-3');
  });

  it('merges className and forwards arbitrary props onto the trigger span', () => {
    const { getByTestId } = render(
      <IconLabel
        icon={Star}
        tooltip="Rotation"
        className="ml-auto"
        data-testid="label"
      />,
    );
    const trigger = getByTestId('label');
    expect(trigger.className).toContain('text-muted-foreground');
    expect(trigger.className).toContain('ml-auto');
  });
});
