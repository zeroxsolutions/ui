import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TreeIndent } from './tree-indent';

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
    expect((container.firstElementChild as HTMLElement).style.paddingLeft).toBe(
      '28px',
    );
  });

  it('stamps data-slot="tree-indent" on the root', () => {
    const { container } = render(
      <TreeIndent
        depth={0}
        hasChildren={false}
        expanded={false}
        onToggleExpand={() => {}}
      >
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
        <TreeIndent
          depth={0}
          hasChildren
          expanded={false}
          onToggleExpand={onToggleExpand}
          expandLabel="Expand node"
        >
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
      <TreeIndent
        depth={0}
        hasChildren={false}
        expanded={false}
        onToggleExpand={() => {}}
      >
        <span>leaf</span>
      </TreeIndent>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});
