import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { useContext, type ReactNode } from 'react';
import { cn } from '../lib/utils';
import { TextClassContext } from './text';

type IconProps = LucideProps & {
  /** The lucide icon to draw, such as `Check` from lucide-react-native. */
  as: LucideIcon;
};

function IconGlyph({ as: Glyph, ...props }: IconProps): ReactNode {
  return <Glyph {...props} />;
}

// A lucide icon takes its size as a prop, never from style, so a size class reaches it through
// the width and height NativeWind resolves.
cssInterop(IconGlyph, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      width: 'size',
      height: 'size',
    },
  },
});

/**
 * A lucide icon styled by `className`. Inside a container that provides TextClassContext, such
 * as a Button, it takes the container's text classes under its own, so it matches the label.
 * An explicit `size` wins over a size class.
 */
function Icon({ className, ...props }: IconProps): ReactNode {
  const textClass = useContext(TextClassContext);

  return <IconGlyph className={cn('text-foreground', textClass, className)} {...props} />;
}

export { Icon };
export type { IconProps };
