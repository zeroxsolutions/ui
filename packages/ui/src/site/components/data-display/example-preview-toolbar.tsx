'use client';

import type { ReactNode } from 'react';
import { MonitorIcon, SmartphoneIcon, TabletIcon } from 'lucide-react';

import { useAnimatedIcon } from '../../../../registry/bases/base-ui/hooks/use-animated-icon';
import { MoonIcon } from '../../../../registry/bases/base-ui/icons/lucide/moon-icon';
import { SunIcon } from '../../../../registry/bases/base-ui/icons/lucide/sun-icon';
import { cn } from '../../../../registry/bases/base-ui/lib/utils';
import { Separator } from '../../../../registry/bases/base-ui/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '../../../../registry/bases/base-ui/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../registry/bases/base-ui/ui/tooltip';
import type { PageTheme } from '../../lib/theme-param';

/** The width a docs preview draws its demo at. */
type ExamplePreviewDevice = 'desktop' | 'tablet' | 'mobile';

interface ExamplePreviewToolbarProps {
  device: ExamplePreviewDevice;
  /** The theme chosen; none pressed while it is not known yet, before the page has hydrated. */
  theme: PageTheme | undefined;
  onDeviceChange(device: ExamplePreviewDevice): void;
  onThemeChange(theme: PageTheme): void;
  className?: string;
}

/** A single choice: pressing the pressed toggle keeps it, so one is always chosen. */
function pick<Value extends string>(current: Value | undefined, set: (value: Value) => void) {
  return (values: string[]) => {
    const picked = values.find((value) => value !== current);
    if (picked) set(picked as Value);
  };
}

interface ExamplePreviewToolbarToggleProps {
  value: string;
  label: string;
  children: ReactNode;
}

/** One choice: an icon toggle named and tipped by `label`. */
function ExamplePreviewToolbarToggle({ value, label, children }: ExamplePreviewToolbarToggleProps): ReactNode {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ToggleGroupItem value={value} size="sm" aria-label={label}>
            {children}
          </ToggleGroupItem>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** A theme's toggle, whose icon plays while the toggle holds the pointer or the focus. */
function ExamplePreviewToolbarThemeToggle({ value }: { value: PageTheme }): ReactNode {
  const icon = useAnimatedIcon();
  const Icon = value === 'light' ? SunIcon : MoonIcon;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ToggleGroupItem value={value} size="sm" aria-label={THEME_LABELS[value]} {...icon.handlers}>
            <Icon ref={icon.ref} aria-hidden />
          </ToggleGroupItem>
        }
      />
      <TooltipContent>{THEME_LABELS[value]}</TooltipContent>
    </Tooltip>
  );
}

const THEME_LABELS: Record<PageTheme, string> = { light: 'Light', dark: 'Dark' };

/** The controls over a docs preview: the width the demo is drawn at, then its theme. */
function ExamplePreviewToolbar({
  device,
  theme,
  onDeviceChange,
  onThemeChange,
  className,
}: ExamplePreviewToolbarProps): ReactNode {
  return (
    <TooltipProvider>
      <div data-slot="example-preview-toolbar" className={cn('flex items-center gap-0.5', className)}>
        <ToggleGroup aria-label="Device" spacing={0.5} value={[device]} onValueChange={pick(device, onDeviceChange)}>
          <ExamplePreviewToolbarToggle value="desktop" label="Desktop">
            <MonitorIcon aria-hidden />
          </ExamplePreviewToolbarToggle>
          <ExamplePreviewToolbarToggle value="tablet" label="Tablet">
            <TabletIcon aria-hidden />
          </ExamplePreviewToolbarToggle>
          <ExamplePreviewToolbarToggle value="mobile" label="Mobile">
            <SmartphoneIcon aria-hidden />
          </ExamplePreviewToolbarToggle>
        </ToggleGroup>
        <Separator orientation="vertical" className="mx-0.5 h-5" />
        <ToggleGroup
          aria-label="Theme"
          spacing={0.5}
          value={theme ? [theme] : []}
          onValueChange={pick(theme, onThemeChange)}
        >
          <ExamplePreviewToolbarThemeToggle value="light" />
          <ExamplePreviewToolbarThemeToggle value="dark" />
        </ToggleGroup>
      </div>
    </TooltipProvider>
  );
}

export { ExamplePreviewToolbar };
export type { ExamplePreviewDevice, ExamplePreviewToolbarProps };
