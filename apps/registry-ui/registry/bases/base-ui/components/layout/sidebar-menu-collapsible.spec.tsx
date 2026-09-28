import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  SidebarMenuCollapsible,
  SidebarMenuCollapsibleContent,
  SidebarMenuCollapsibleTrigger,
} from './sidebar-menu-collapsible';
import { SidebarMenu, SidebarProvider } from '@/registry/bases/base-ui/ui/sidebar';

// jsdom ships no matchMedia; SidebarProvider's useIsMobile needs it.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

afterEach(() => {
  cleanup();
});

// SidebarMenuButton (the trigger) reads SidebarProvider context, so the section
// is exercised the way a real rail mounts it.
function Section({
  open,
  defaultOpen,
  onOpenChange,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <SidebarProvider>
      <SidebarMenu>
        <SidebarMenuCollapsible open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
          <SidebarMenuCollapsibleTrigger>
            <span>Topics</span>
          </SidebarMenuCollapsibleTrigger>
          <SidebarMenuCollapsibleContent>
            <SidebarMenu>
              <li>First topic</li>
            </SidebarMenu>
          </SidebarMenuCollapsibleContent>
        </SidebarMenuCollapsible>
      </SidebarMenu>
    </SidebarProvider>
  );
}

describe('SidebarMenuCollapsible', () => {
  it('renders the trigger as a button inside a list item', () => {
    render(<Section defaultOpen />);
    const trigger = screen.getByRole('button', { name: /topics/i });
    expect(trigger.tagName).toBe('BUTTON');
    // It must be valid inside a SidebarMenu (<ul>) — the disclosure is a <li>.
    expect(trigger.closest('li')).not.toBeNull();
  });

  it('shows content when open and toggles it on click (uncontrolled)', () => {
    render(<Section defaultOpen />);
    const trigger = screen.getByRole('button', { name: /topics/i });
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.queryByText('First topic')).not.toBeNull();

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('is collapsed by default and expands on click', () => {
    render(<Section />);
    const trigger = screen.getByRole('button', { name: /topics/i });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.queryByText('First topic')).not.toBeNull();
  });

  it('fires onOpenChange with the new value when controlled', () => {
    const onOpenChange = vi.fn();
    render(<Section open={false} onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole('button', { name: /topics/i });

    fireEvent.click(trigger);
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    // Stays closed until the controller flips `open` (no uncontrolled drift).
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('rotates the chevron via the trigger aria-expanded group (the data-state bug fix)', () => {
    const { container } = render(<Section defaultOpen />);
    const chevron = container.querySelector('svg');
    expect(chevron?.getAttribute('class')).toContain('group-aria-expanded/sidebar-menu-collapsible:rotate-90');
  });
});
