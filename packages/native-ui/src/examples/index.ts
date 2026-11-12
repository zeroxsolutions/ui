/**
 * One demo per drawn registry item, written as an app writes it, importing the items through `@/`.
 * build-registry copies them into each style's emitted sources, and the native preview draws each one
 * at `/native-preview/index.html?style=<style>&demo=<key>`.
 */
import type { ComponentType } from 'react';

import { AccordionDemo } from './accordion-demo';
import { AiProviderCardDemo } from './ai-provider-card-demo';
import { AiProviderPickerDemo } from './ai-provider-picker-demo';
import { AlertDemo } from './alert-demo';
import { AlertDialogDemo } from './alert-dialog-demo';
import { AspectRatioDemo } from './aspect-ratio-demo';
import { AttachmentDemo } from './attachment-demo';
import { AvatarDemo } from './avatar-demo';
import { AvatarPickerDemo } from './avatar-picker-demo';
import { BadgeDemo } from './badge-demo';
import { BreadcrumbDemo } from './breadcrumb-demo';
import { BubbleDemo } from './bubble-demo';
import { ButtonDemo } from './button-demo';
import { ButtonGroupDemo } from './button-group-demo';
import { CalendarDemo } from './calendar-demo';
import { CardDemo } from './card-demo';
import { CarouselDemo } from './carousel-demo';
import { CenterDemo } from './center-demo';
import { ChartDemo } from './chart-demo';
import { ChatMessageDemo } from './chat-message-demo';
import { ChatSuggestionItemDemo } from './chat-suggestion-item-demo';
import { CheckboxDemo } from './checkbox-demo';
import { CodeBlockDemo } from './code-block-demo';
import { CodeCardDemo } from './code-card-demo';
import { CodeInputDemo } from './code-input-demo';
import { CollapsibleCardDemo } from './collapsible-card-demo';
import { CollapsibleDemo } from './collapsible-demo';
import { ComboboxDemo } from './combobox-demo';
import { CommandDemo } from './command-demo';
import { CommandMenuDemo } from './command-menu-demo';
import { ContextMenuDemo } from './context-menu-demo';
import { CopyButtonDemo } from './copy-button-demo';
import { DataTableColumnHeaderDemo } from './data-table-column-header-demo';
import { DataTableDemo } from './data-table-demo';
import { DialogDemo } from './dialog-demo';
import { DirectionDemo } from './direction-demo';
import { DrawerDemo } from './drawer-demo';
import { DropdownMenuDemo } from './dropdown-menu-demo';
import { EditorTabDemo } from './editor-tab-demo';
import { EmojiAppearanceToggleGroupDemo } from './emoji-appearance-toggle-group-demo';
import { EmojiPickerDemo } from './emoji-picker-demo';
import { EmptyDemo } from './empty-demo';
import { FieldDemo } from './field-demo';
import { FileTreeDemo } from './file-tree-demo';
import { FileTypeIconDemo } from './file-type-icon-demo';
import { FloatingToolbarDemo } from './floating-toolbar-demo';
import { FontPreviewDemo } from './font-preview-demo';
import { FormDemo } from './form-demo';
import { FrontmatterFormDemo } from './frontmatter-form-demo';
import { HoverCardDemo } from './hover-card-demo';
import { IconDemo } from './icon-demo';
import { IconLabelDemo } from './icon-label-demo';
import { IconMediaDemo } from './icon-media-demo';
import { ImagePreviewDemo } from './image-preview-demo';
import { InputDemo } from './input-demo';
import { InputGroupDemo } from './input-group-demo';
import { InputOtpDemo } from './input-otp-demo';
import { ItemDemo } from './item-demo';
import { KbdDemo } from './kbd-demo';
import { LabelDemo } from './label-demo';
import { LanguageComboboxDemo } from './language-combobox-demo';
import { LanguageToggleGroupDemo } from './language-toggle-group-demo';
import { MarkdownViewDemo } from './markdown-view-demo';
import { MarkerDemo } from './marker-demo';
import { MenubarDemo } from './menubar-demo';
import { MessageDemo } from './message-demo';
import { MessageScrollerDemo } from './message-scroller-demo';
import { ModelInfoCardDemo } from './model-info-card-demo';
import { ModelListDemo } from './model-list-demo';
import { NativeSelectDemo } from './native-select-demo';
import { NavigationMenuDemo } from './navigation-menu-demo';
import { NumberFieldDemo } from './number-field-demo';
import { PageContainerDemo } from './page-container-demo';
import { PaginationDemo } from './pagination-demo';
import { PanelFieldGroupDemo } from './panel-field-group-demo';
import { PanelHeaderDemo } from './panel-header-demo';
import { PanelRowDemo } from './panel-row-demo';
import { PasswordInputDemo } from './password-input-demo';
import { PasswordStrengthDemo } from './password-strength-demo';
import { PermissionCardDemo } from './permission-card-demo';
import { PopoverDemo } from './popover-demo';
import { ProgressDemo } from './progress-demo';
import { QuestionnaireDemo } from './questionnaire-demo';
import { RadioGroupDemo } from './radio-group-demo';
import { ReasoningCollapsibleDemo } from './reasoning-collapsible-demo';
import { ResizableDemo } from './resizable-demo';
import { ResizeHandleDemo } from './resize-handle-demo';
import { ScrollAreaDemo } from './scroll-area-demo';
import { SelectDemo } from './select-demo';
import { SeparatorDemo } from './separator-demo';
import { SheetDemo } from './sheet-demo';
import { SidebarDemo } from './sidebar-demo';
import { SkeletonDemo } from './skeleton-demo';
import { SliderDemo } from './slider-demo';
import { SonnerDemo } from './sonner-demo';
import { SpinnerDemo } from './spinner-demo';
import { StatusIndicatorDemo } from './status-indicator-demo';
import { SwitchDemo } from './switch-demo';
import { TabBarDemo } from './tab-bar-demo';
import { TableDemo } from './table-demo';
import { TabsDemo } from './tabs-demo';
import { TagInputDemo } from './tag-input-demo';
import { TextDemo } from './text-demo';
import { ThemeDemo } from './theme-demo';
import { ToastDemo } from './toast-demo';
import { TextareaDemo } from './textarea-demo';
import { ToggleDemo } from './toggle-demo';
import { ToggleGroupDemo } from './toggle-group-demo';
import { TooltipDemo } from './tooltip-demo';
import { TraceDemo } from './trace-demo';
import { TreeItemDemo } from './tree-item-demo';
import { UnsavedChangesToolbarDemo } from './unsaved-changes-toolbar-demo';
import { UnsavedIndicatorDemo } from './unsaved-indicator-demo';

/** Each demo by its name, the file's name without `.tsx`, such as `button-demo`. */
const demos: Readonly<Record<string, ComponentType>> = {
  'accordion-demo': AccordionDemo,
  'ai-provider-card-demo': AiProviderCardDemo,
  'ai-provider-picker-demo': AiProviderPickerDemo,
  'alert-demo': AlertDemo,
  'alert-dialog-demo': AlertDialogDemo,
  'aspect-ratio-demo': AspectRatioDemo,
  'attachment-demo': AttachmentDemo,
  'avatar-demo': AvatarDemo,
  'avatar-picker-demo': AvatarPickerDemo,
  'badge-demo': BadgeDemo,
  'breadcrumb-demo': BreadcrumbDemo,
  'bubble-demo': BubbleDemo,
  'button-demo': ButtonDemo,
  'button-group-demo': ButtonGroupDemo,
  'calendar-demo': CalendarDemo,
  'card-demo': CardDemo,
  'carousel-demo': CarouselDemo,
  'center-demo': CenterDemo,
  'chart-demo': ChartDemo,
  'chat-message-demo': ChatMessageDemo,
  'chat-suggestion-item-demo': ChatSuggestionItemDemo,
  'checkbox-demo': CheckboxDemo,
  'code-block-demo': CodeBlockDemo,
  'code-card-demo': CodeCardDemo,
  'code-input-demo': CodeInputDemo,
  'collapsible-card-demo': CollapsibleCardDemo,
  'collapsible-demo': CollapsibleDemo,
  'combobox-demo': ComboboxDemo,
  'command-demo': CommandDemo,
  'command-menu-demo': CommandMenuDemo,
  'context-menu-demo': ContextMenuDemo,
  'copy-button-demo': CopyButtonDemo,
  'data-table-column-header-demo': DataTableColumnHeaderDemo,
  'data-table-demo': DataTableDemo,
  'dialog-demo': DialogDemo,
  'direction-demo': DirectionDemo,
  'drawer-demo': DrawerDemo,
  'dropdown-menu-demo': DropdownMenuDemo,
  'editor-tab-demo': EditorTabDemo,
  'emoji-appearance-toggle-group-demo': EmojiAppearanceToggleGroupDemo,
  'emoji-picker-demo': EmojiPickerDemo,
  'empty-demo': EmptyDemo,
  'field-demo': FieldDemo,
  'file-tree-demo': FileTreeDemo,
  'file-type-icon-demo': FileTypeIconDemo,
  'floating-toolbar-demo': FloatingToolbarDemo,
  'font-preview-demo': FontPreviewDemo,
  'form-demo': FormDemo,
  'frontmatter-form-demo': FrontmatterFormDemo,
  'hover-card-demo': HoverCardDemo,
  'icon-demo': IconDemo,
  'icon-label-demo': IconLabelDemo,
  'icon-media-demo': IconMediaDemo,
  'image-preview-demo': ImagePreviewDemo,
  'input-demo': InputDemo,
  'input-group-demo': InputGroupDemo,
  'input-otp-demo': InputOtpDemo,
  'item-demo': ItemDemo,
  'kbd-demo': KbdDemo,
  'label-demo': LabelDemo,
  'language-combobox-demo': LanguageComboboxDemo,
  'language-toggle-group-demo': LanguageToggleGroupDemo,
  'markdown-view-demo': MarkdownViewDemo,
  'marker-demo': MarkerDemo,
  'menubar-demo': MenubarDemo,
  'message-demo': MessageDemo,
  'message-scroller-demo': MessageScrollerDemo,
  'model-info-card-demo': ModelInfoCardDemo,
  'model-list-demo': ModelListDemo,
  'native-select-demo': NativeSelectDemo,
  'navigation-menu-demo': NavigationMenuDemo,
  'number-field-demo': NumberFieldDemo,
  'page-container-demo': PageContainerDemo,
  'pagination-demo': PaginationDemo,
  'panel-field-group-demo': PanelFieldGroupDemo,
  'panel-header-demo': PanelHeaderDemo,
  'panel-row-demo': PanelRowDemo,
  'password-input-demo': PasswordInputDemo,
  'password-strength-demo': PasswordStrengthDemo,
  'permission-card-demo': PermissionCardDemo,
  'popover-demo': PopoverDemo,
  'progress-demo': ProgressDemo,
  'questionnaire-demo': QuestionnaireDemo,
  'radio-group-demo': RadioGroupDemo,
  'reasoning-collapsible-demo': ReasoningCollapsibleDemo,
  'resizable-demo': ResizableDemo,
  'resize-handle-demo': ResizeHandleDemo,
  'scroll-area-demo': ScrollAreaDemo,
  'select-demo': SelectDemo,
  'separator-demo': SeparatorDemo,
  'sheet-demo': SheetDemo,
  'sidebar-demo': SidebarDemo,
  'skeleton-demo': SkeletonDemo,
  'slider-demo': SliderDemo,
  'sonner-demo': SonnerDemo,
  'spinner-demo': SpinnerDemo,
  'status-indicator-demo': StatusIndicatorDemo,
  'switch-demo': SwitchDemo,
  'tab-bar-demo': TabBarDemo,
  'table-demo': TableDemo,
  'tabs-demo': TabsDemo,
  'tag-input-demo': TagInputDemo,
  'text-demo': TextDemo,
  'theme-demo': ThemeDemo,
  'toast-demo': ToastDemo,
  'textarea-demo': TextareaDemo,
  'toggle-demo': ToggleDemo,
  'toggle-group-demo': ToggleGroupDemo,
  'tooltip-demo': TooltipDemo,
  'trace-demo': TraceDemo,
  'tree-item-demo': TreeItemDemo,
  'unsaved-changes-toolbar-demo': UnsavedChangesToolbarDemo,
  'unsaved-indicator-demo': UnsavedIndicatorDemo,
};

export { demos };
