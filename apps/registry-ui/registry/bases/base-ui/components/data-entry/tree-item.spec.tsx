import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TreeIndent, TreeItem } from './tree-item';

afterEach(cleanup);

const base = {
  depth: 0,
  hasChildren: false,
  expanded: false,
  onToggleExpand: () => {},
};

describe('TreeItem', () => {
  it('shows the name and fires onActivate with the raw event on a name click', () => {
    const onActivate = vi.fn();
    render(<TreeItem {...base} name="Layer 1" onActivate={onActivate} />);

    fireEvent.click(screen.getByText('Layer 1'));
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(onActivate.mock.calls[0][0]).toHaveProperty('type', 'click');
  });

  it('swaps the name for an inline input while renaming', () => {
    const onCancel = vi.fn();
    render(
      <TreeItem
        {...base}
        name="Layer 1"
        rename={{
          editing: true,
          draft: 'Renamed',
          onDraftChange: () => {},
          onCommit: () => {},
          onCancel,
        }}
      />,
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('Renamed');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('forwards ref to the row div (React 19 ref-as-prop, no forwardRef)', () => {
    const ref = createRef<HTMLDivElement>();
    render(<TreeItem {...base} name="Layer 1" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

afterEach(cleanup);

describe('TreeIndent', () => {
  it('indents by baseIndent + depth * indentStep', () => {
    const { container } = render(
      <TreeIndent
        depth={2}
        indentStep={12}
        baseIndent={4}
        hasChildren={false}
        expanded={false}
        onToggleExpand={() => {}}
      >
        <span>node</span>
      </TreeIndent>,
    );
    expect((container.firstElementChild as HTMLElement).style.paddingLeft).toBe('28px');
  });

  it('stamps data-slot="tree-indent" on the root', () => {
    const { container } = render(
      <TreeIndent depth={0} hasChildren={false} expanded={false} onToggleExpand={() => {}}>
        <span>leaf</span>
      </TreeIndent>,
    );
    expect(container.querySelector('[data-slot="tree-indent"]')).toBeTruthy();
  });

  it('toggles via the chevron and stops propagation so the row is not selected', () => {
    const onToggleExpand = vi.fn();
    const onRowClick = vi.fn();
    render(
      <div onClick={onRowClick}>
        <TreeIndent depth={0} hasChildren expanded={false} onToggleExpand={onToggleExpand} expandLabel="Expand node">
          <span>node</span>
        </TreeIndent>
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand node' }));
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('renders an aligned spacer (no disclosure button) for a leaf', () => {
    render(
      <TreeIndent depth={0} hasChildren={false} expanded={false} onToggleExpand={() => {}}>
        <span>leaf</span>
      </TreeIndent>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});

export {};
