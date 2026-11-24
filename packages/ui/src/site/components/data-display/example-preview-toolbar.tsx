'use client';

import type { ReactNode } from 'react';
import { MonitorIcon, SmartphoneIcon, TabletIcon } from 'lucide-react';

import { useAnimatedIcon } from '../../../../registry/bases/base-ui/hooks/use-animated-icon';
import { SunMoonIcon } from '../../../../registry/bases/base-ui/icons/lucide/sun-moon-icon';
import { cn } from '../../../../registry/bases/base-ui/lib/utils';
import { Button } from '../../../../registry/bases/base-ui/ui/button';
import { Separator } from '../../../../registry/bases/base-ui/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '../../../../registry/bases/base-ui/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../registry/bases/base-ui/ui/tooltip';
import type { PageTheme } from '../../lib/view-params';

/** The width a docs preview draws its demo at. */
type ExamplePreviewDevice = 'desktop' | 'tablet' | 'mobile';

/** The frame's width per device; a desktop frame takes its stage's. */
const DEVICE_WIDTHS: Record<Exclude<ExamplePreviewDevice, 'desktop'>, number> = { tablet: 768, mobile: 375 };

interface ExamplePreviewToolbarProps {
  device: ExamplePreviewDevice;
  /** The theme chosen; the toggle is unpressed and disabled while it is not known yet, before the page has hydrated. */
  theme: PageTheme | undefined;
  onDeviceChange(device: ExamplePreviewDevice): void;
  onThemeChange(theme: PageTheme): void;
  className?: string;
}

/** A single choice: pressing the pressed toggle keeps it, so one is always chosen. */
function pick<Value extends string>(current: Value, set: (value: Value) => void) {
  return (values: string[]) => {
    const picked = values.find((value) => value !== current);
    if (picked) set(picked as Value);
  };
}

interface ExamplePreviewToolbarDeviceProps {
  value: ExamplePreviewDevice;
  label: string;
  children: ReactNode;
}

/** One device: an icon toggle named and tipped by `label`. */
function ExamplePreviewToolbarDevice({ value, label, children }: ExamplePreviewToolbarDeviceProps): ReactNode {
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

interface ExamplePreviewToolbarThemeProps {
  theme: PageTheme | undefined;
  onThemeChange(theme: PageTheme): void;
}

/**
 * The preview's theme toggle, drawn as the site header's `ModeSwitcher`: pressed while the demo is dark. Its
 * icon plays on the button's hover or focus.
 */
function ExamplePreviewToolbarTheme({ theme, onThemeChange }: ExamplePreviewToolbarThemeProps): ReactNode {
  const icon = useAnimatedIcon();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            data-slot="example-preview-toolbar-theme"
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle preview theme"
            aria-pressed={theme === 'dark'}
            disabled={theme === undefined}
            onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
            {...icon.handlers}
          />
        }
      >
        <SunMoonIcon ref={icon.ref} aria-hidden />
      </TooltipTrigger>
      <TooltipContent>Toggle preview theme</TooltipContent>
    </Tooltip>
  );
}

/** The controls over a docs preview or a view page: the width the demo is drawn at, then its theme. */
function ExamplePreviewToolbar({
  device,
  theme,
  onDeviceChange,
  onThemeChange,
  className,
}: ExamplePreviewToolbarProps): ReactNode {
  return (
    <TooltipProvider>
      <div data-slot="example-preview-toolbar" className={cn('flex items-center gap-1', className)}>
        <ToggleGroup aria-label="Device" spacing={0.5} value={[device]} onValueChange={pick(device, onDeviceChange)}>
          <ExamplePreviewToolbarDevice value="desktop" label="Desktop">
            <MonitorIcon aria-hidden />
          </ExamplePreviewToolbarDevice>
          <ExamplePreviewToolbarDevice value="tablet" label="Tablet">
            <TabletIcon aria-hidden />
          </ExamplePreviewToolbarDevice>
          <ExamplePreviewToolbarDevice value="mobile" label="Mobile">
            <SmartphoneIcon aria-hidden />
          </ExamplePreviewToolbarDevice>
        </ToggleGroup>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <ExamplePreviewToolbarTheme theme={theme} onThemeChange={onThemeChange} />
      </div>
    </TooltipProvider>
  );
}

export { DEVICE_WIDTHS, ExamplePreviewToolbar };
export type { ExamplePreviewDevice, ExamplePreviewToolbarProps };
