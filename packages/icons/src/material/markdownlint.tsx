import type { ComponentPropsWithoutRef, FC } from 'react';

type IconProps = { size?: string | number } & ComponentPropsWithoutRef<'svg'>;

/** markdownlint — Material Icon Theme (MIT). */
const MarkdownlintIcon: FC<IconProps> = ({ size = '1em', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width={size} height={size} {...props}><path fill="#42a5f5" d="M6 5 4 6.75 2 5H1v6h2V8l1 1 1-1v3h2V5zm4.73 3.975L10 8H8l2 3h2l3-6h-2z"/></svg>
);

export { MarkdownlintIcon };
