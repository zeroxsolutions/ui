/**
 * One demo per drawn registry item, written as an app writes it, importing the items through `@/`.
 * The native preview draws each one at `/native-preview/<style>/<key>`.
 */
import type { ComponentType } from 'react';

import { AvatarDemo } from './avatar-demo';
import { BadgeDemo } from './badge-demo';
import { ButtonDemo } from './button-demo';
import { CardDemo } from './card-demo';
import { CheckboxDemo } from './checkbox-demo';
import { CodeInputDemo } from './code-input-demo';
import { IconDemo } from './icon-demo';
import { InputDemo } from './input-demo';
import { InputGroupDemo } from './input-group-demo';
import { InputOtpDemo } from './input-otp-demo';
import { LabelDemo } from './label-demo';
import { PasswordInputDemo } from './password-input-demo';
import { PasswordStrengthDemo } from './password-strength-demo';
import { ProgressDemo } from './progress-demo';
import { RadioGroupDemo } from './radio-group-demo';
import { SeparatorDemo } from './separator-demo';
import { SkeletonDemo } from './skeleton-demo';
import { SpinnerDemo } from './spinner-demo';
import { SwitchDemo } from './switch-demo';
import { TabBarDemo } from './tab-bar-demo';
import { TabsDemo } from './tabs-demo';
import { TextDemo } from './text-demo';
import { ThemeDemo } from './theme-demo';
import { TextareaDemo } from './textarea-demo';
import { ToggleDemo } from './toggle-demo';
import { ToggleGroupDemo } from './toggle-group-demo';
import { UnsavedChangesToolbarDemo } from './unsaved-changes-toolbar-demo';

/** Each demo by its name, the file's name without `.tsx`, such as `button-demo`. */
const demos: Readonly<Record<string, ComponentType>> = {
  'avatar-demo': AvatarDemo,
  'badge-demo': BadgeDemo,
  'button-demo': ButtonDemo,
  'card-demo': CardDemo,
  'checkbox-demo': CheckboxDemo,
  'code-input-demo': CodeInputDemo,
  'icon-demo': IconDemo,
  'input-demo': InputDemo,
  'input-group-demo': InputGroupDemo,
  'input-otp-demo': InputOtpDemo,
  'label-demo': LabelDemo,
  'password-input-demo': PasswordInputDemo,
  'password-strength-demo': PasswordStrengthDemo,
  'progress-demo': ProgressDemo,
  'radio-group-demo': RadioGroupDemo,
  'separator-demo': SeparatorDemo,
  'skeleton-demo': SkeletonDemo,
  'spinner-demo': SpinnerDemo,
  'switch-demo': SwitchDemo,
  'tab-bar-demo': TabBarDemo,
  'tabs-demo': TabsDemo,
  'text-demo': TextDemo,
  'theme-demo': ThemeDemo,
  'textarea-demo': TextareaDemo,
  'toggle-demo': ToggleDemo,
  'toggle-group-demo': ToggleGroupDemo,
  'unsaved-changes-toolbar-demo': UnsavedChangesToolbarDemo,
};

export { demos };
