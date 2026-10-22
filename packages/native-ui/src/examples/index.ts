/**
 * One demo per drawn registry item, written as an app writes it, importing the items through `@/`.
 * build-registry copies them into each style's emitted sources, and the native preview draws each one
 * at `/native-preview/index.html?style=<style>&demo=<key>`.
 */
import type { ComponentType } from 'react';

import { AccordionDemo } from './accordion-demo';
import { AlertDemo } from './alert-demo';
import { AlertDialogDemo } from './alert-dialog-demo';
import { AspectRatioDemo } from './aspect-ratio-demo';
import { AttachmentDemo } from './attachment-demo';
import { AvatarDemo } from './avatar-demo';
import { BadgeDemo } from './badge-demo';
import { BreadcrumbDemo } from './breadcrumb-demo';
import { BubbleDemo } from './bubble-demo';
import { ButtonDemo } from './button-demo';
import { ButtonGroupDemo } from './button-group-demo';
import { CalendarDemo } from './calendar-demo';
import { CardDemo } from './card-demo';
import { CarouselDemo } from './carousel-demo';
import { ChartDemo } from './chart-demo';
import { CheckboxDemo } from './checkbox-demo';
import { CodeBlockDemo } from './code-block-demo';
import { CodeInputDemo } from './code-input-demo';
import { CollapsibleDemo } from './collapsible-demo';
import { ComboboxDemo } from './combobox-demo';
import { CommandDemo } from './command-demo';
import { ContextMenuDemo } from './context-menu-demo';
import { DialogDemo } from './dialog-demo';
import { DirectionDemo } from './direction-demo';
import { DrawerDemo } from './drawer-demo';
import { DropdownMenuDemo } from './dropdown-menu-demo';
import { EmptyDemo } from './empty-demo';
import { FieldDemo } from './field-demo';
import { FormDemo } from './form-demo';
import { HoverCardDemo } from './hover-card-demo';
import { IconDemo } from './icon-demo';
import { InputDemo } from './input-demo';
import { InputGroupDemo } from './input-group-demo';
import { InputOtpDemo } from './input-otp-demo';
import { ItemDemo } from './item-demo';
import { KbdDemo } from './kbd-demo';
import { LabelDemo } from './label-demo';
import { MarkerDemo } from './marker-demo';
import { MenubarDemo } from './menubar-demo';
import { MessageDemo } from './message-demo';
import { NativeSelectDemo } from './native-select-demo';
import { NavigationMenuDemo } from './navigation-menu-demo';
import { PaginationDemo } from './pagination-demo';
import { PasswordInputDemo } from './password-input-demo';
import { PasswordStrengthDemo } from './password-strength-demo';
import { PopoverDemo } from './popover-demo';
import { ProgressDemo } from './progress-demo';
import { RadioGroupDemo } from './radio-group-demo';
import { ResizableDemo } from './resizable-demo';
import { ScrollAreaDemo } from './scroll-area-demo';
import { SelectDemo } from './select-demo';
import { SeparatorDemo } from './separator-demo';
import { SheetDemo } from './sheet-demo';
import { SidebarDemo } from './sidebar-demo';
import { SkeletonDemo } from './skeleton-demo';
import { SliderDemo } from './slider-demo';
import { SonnerDemo } from './sonner-demo';
import { SpinnerDemo } from './spinner-demo';
import { SwitchDemo } from './switch-demo';
import { TabBarDemo } from './tab-bar-demo';
import { TableDemo } from './table-demo';
import { TabsDemo } from './tabs-demo';
import { TextDemo } from './text-demo';
import { ThemeDemo } from './theme-demo';
import { ToastDemo } from './toast-demo';
import { TextareaDemo } from './textarea-demo';
import { ToggleDemo } from './toggle-demo';
import { ToggleGroupDemo } from './toggle-group-demo';
import { TooltipDemo } from './tooltip-demo';
import { UnsavedChangesToolbarDemo } from './unsaved-changes-toolbar-demo';

/** Each demo by its name, the file's name without `.tsx`, such as `button-demo`. */
const demos: Readonly<Record<string, ComponentType>> = {
  'accordion-demo': AccordionDemo,
  'alert-demo': AlertDemo,
  'alert-dialog-demo': AlertDialogDemo,
  'aspect-ratio-demo': AspectRatioDemo,
  'attachment-demo': AttachmentDemo,
  'avatar-demo': AvatarDemo,
  'badge-demo': BadgeDemo,
  'breadcrumb-demo': BreadcrumbDemo,
  'bubble-demo': BubbleDemo,
  'button-demo': ButtonDemo,
  'button-group-demo': ButtonGroupDemo,
  'calendar-demo': CalendarDemo,
  'card-demo': CardDemo,
  'carousel-demo': CarouselDemo,
  'chart-demo': ChartDemo,
  'checkbox-demo': CheckboxDemo,
  'code-block-demo': CodeBlockDemo,
  'code-input-demo': CodeInputDemo,
  'collapsible-demo': CollapsibleDemo,
  'combobox-demo': ComboboxDemo,
  'command-demo': CommandDemo,
  'context-menu-demo': ContextMenuDemo,
  'dialog-demo': DialogDemo,
  'direction-demo': DirectionDemo,
  'drawer-demo': DrawerDemo,
  'dropdown-menu-demo': DropdownMenuDemo,
  'empty-demo': EmptyDemo,
  'field-demo': FieldDemo,
  'form-demo': FormDemo,
  'hover-card-demo': HoverCardDemo,
  'icon-demo': IconDemo,
  'input-demo': InputDemo,
  'input-group-demo': InputGroupDemo,
  'input-otp-demo': InputOtpDemo,
  'item-demo': ItemDemo,
  'kbd-demo': KbdDemo,
  'label-demo': LabelDemo,
  'marker-demo': MarkerDemo,
  'menubar-demo': MenubarDemo,
  'message-demo': MessageDemo,
  'native-select-demo': NativeSelectDemo,
  'navigation-menu-demo': NavigationMenuDemo,
  'pagination-demo': PaginationDemo,
  'password-input-demo': PasswordInputDemo,
  'password-strength-demo': PasswordStrengthDemo,
  'popover-demo': PopoverDemo,
  'progress-demo': ProgressDemo,
  'radio-group-demo': RadioGroupDemo,
  'resizable-demo': ResizableDemo,
  'scroll-area-demo': ScrollAreaDemo,
  'select-demo': SelectDemo,
  'separator-demo': SeparatorDemo,
  'sheet-demo': SheetDemo,
  'sidebar-demo': SidebarDemo,
  'skeleton-demo': SkeletonDemo,
  'slider-demo': SliderDemo,
  'sonner-demo': SonnerDemo,
  'spinner-demo': SpinnerDemo,
  'switch-demo': SwitchDemo,
  'tab-bar-demo': TabBarDemo,
  'table-demo': TableDemo,
  'tabs-demo': TabsDemo,
  'text-demo': TextDemo,
  'theme-demo': ThemeDemo,
  'toast-demo': ToastDemo,
  'textarea-demo': TextareaDemo,
  'toggle-demo': ToggleDemo,
  'toggle-group-demo': ToggleGroupDemo,
  'tooltip-demo': TooltipDemo,
  'unsaved-changes-toolbar-demo': UnsavedChangesToolbarDemo,
};

export { demos };
