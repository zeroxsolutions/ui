import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Section } from './section';

beforeAll(() => {
  // The add button rides a Base UI Tooltip → ResizeObserver, absent in jsdom.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

describe('Section', () => {
  it('renders the title and hides the body when collapsed', () => {
    const { getByText, queryByText, rerender } = render(
      <Section title="Effects" open onToggle={vi.fn()}>
        <div>body</div>
      </Section>,
    );
    expect(getByText('Effects')).toBeTruthy();
    expect(getByText('body')).toBeTruthy();

    rerender(
      <Section title="Effects" open={false} onToggle={vi.fn()}>
        <div>body</div>
      </Section>,
    );
    expect(queryByText('body')).toBeNull();
  });

  it('calls onToggle and onAdd from their controls', () => {
    const onToggle = vi.fn();
    const onAdd = vi.fn();
    const { getByText, getByTestId } = render(
      <Section
        title="Layers"
        count={3}
        open
        onToggle={onToggle}
        onAdd={onAdd}
        onAddTestId="add-layer"
      >
        <div>body</div>
      </Section>,
    );

    fireEvent.click(getByText('Layers'));
    expect(onToggle).toHaveBeenCalledTimes(1);

    fireEvent.click(getByTestId('add-layer'));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('forwards className and arbitrary props onto the root', () => {
    const { container } = render(
      <Section title="Layers" className="custom-root" data-testid="section-root">
        <div>body</div>
      </Section>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('custom-root');
    expect(root.getAttribute('data-testid')).toBe('section-root');
  });
});
