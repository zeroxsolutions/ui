import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** textlint — Material Icon Theme (MIT). */
const TextlintIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width={size} height={size} {...props}><path fill="#f06292" d="M10 22V8H4v20h24v-6z"/><path fill="#00e5ff" d="M14 8h4v20h-4z"/><path fill="#00e5ff" d="M4 4h24v6H4z"/></svg>
);

export { TextlintIcon };
