import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import { useContext, type ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { cn } from '../lib/utils';
import { TextClassContext } from './text';

type IconProps = LucideProps & {
  /** The lucide icon to draw, such as `Check` from lucide-react-native. */
  as: LucideIcon;
};

function IconGlyph({ as: Glyph, ...props }: IconProps): ReactNode {
  return <Glyph {...props} />;
}

// A lucide icon takes its size and colour as props, never from style, so a class reaches them
// through the width, height and colour NativeWind resolves.
cssInterop(IconGlyph, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      width: 'size',
      height: 'size',
      color: true,
    },
  },
});

/**
 * A lucide icon styled by `className`. Inside a container that provides TextClassContext, such
 * as a Button, it takes the container's text classes under its own, so it matches the label.
 * An explicit `size` or `color` wins over a class.
 */
function Icon({ className, size, color, style, ...props }: IconProps): ReactNode {
  const textClass = useContext(TextClassContext);

  // NativeWind hands a mapped prop the class's value over the caller's, and lets inline style win
  // over a class, so an explicit size or colour goes in as style. TextStyle, because the colour
  // is not a ViewStyle key, and the svg's style is typed as one.
  const explicitStyle: TextStyle = {
    ...(size === undefined ? {} : { width: Number(size), height: Number(size) }),
    ...(color === undefined ? {} : { color }),
  };

  return (
    <IconGlyph className={cn('text-foreground', textClass, className)} style={[explicitStyle, style]} {...props} />
  );
}

export { Icon };
export type { IconProps };
