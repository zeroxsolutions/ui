import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  SidebarGroupCollapsible,
  SidebarGroupCollapsibleContent,
  SidebarGroupCollapsibleTrigger,
} from './sidebar-group-collapsible';
import { SidebarGroup } from '@/registry/bases/base-ui/ui/sidebar';

afterEach(() => {
  cleanup();
});

function Group({
  open,
  defaultOpen,
  onOpenChange,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupCollapsible
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        <SidebarGroupCollapsibleTrigger>
          Workspaces
        </SidebarGroupCollapsibleTrigger>
        <SidebarGroupCollapsibleContent>
          <div>Acme workspace</div>
        </SidebarGroupCollapsibleContent>
      </SidebarGroupCollapsible>
    </SidebarGroup>
  );
}

describe('SidebarGroupCollapsible', () => {
  it('renders the group label as the disclosure button', () => {
    render(<Group defaultOpen />);
    const trigger = screen.getByRole('button', { name: /workspaces/i });
    expect(trigger.tagName).toBe('BUTTON');
  });

  it('shows content when open and toggles it on click (uncontrolled)', () => {
    render(<Group defaultOpen />);
    const trigger = screen.getByRole('button', { name: /workspaces/i });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.queryByText('Acme workspace')).not.toBeNull();

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('is collapsed by default and expands on click', () => {
    render(<Group />);
    const trigger = screen.getByRole('button', { name: /workspaces/i });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.queryByText('Acme workspace')).not.toBeNull();
  });

  it('fires onOpenChange with the new value when controlled', () => {
    const onOpenChange = vi.fn();
    render(<Group open={false} onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole('button', { name: /workspaces/i });

    fireEvent.click(trigger);
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('rotates the chevron off aria-expanded (not Radix data-state)', () => {
    const { container } = render(<Group defaultOpen />);
    const chevron = container.querySelector('svg');
    expect(chevron?.getAttribute('class')).toContain(
      'group-aria-expanded/sidebar-group-collapsible:rotate-90',
    );
  });
});
