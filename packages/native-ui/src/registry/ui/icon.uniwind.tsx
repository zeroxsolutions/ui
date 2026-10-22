import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { createContext, useContext, type ReactNode } from 'react';
import type { TextStyle } from 'react-native';
import { withUniwind } from 'uniwind';
import { cn } from '../lib/utils';
import { TextClassContext } from './text';

/**
 * The classes a container gives every Icon inside it that names no size of its own, such as the
 * size of a Button's icon. Icon drops them when its `className` holds a `size-` class or it is
 * given a `size`.
 */
const IconClassContext = createContext<string | undefined>(undefined);

type IconProps = LucideProps & {
  /** The lucide icon to draw, such as `Check` from lucide-react-native. */
  as: LucideIcon;
};

// withUniwind hands the component its className as well as the props it mapped from it; the glyph
// takes the mapped ones, so the className stops here rather than reaching the Svg.
function IconGlyph({ as: Glyph, className: _mapped, ...props }: IconProps): ReactNode {
  return <Glyph {...props} />;
}

// The colour is read from `color`, not Uniwind's `accent-*`, so the text classes a Button hands
// its label colour the icon beside it too. `style` takes every other class, such as a margin or a
// shrink, so the svg sits in its row as a View with those classes would.
const StyledIconGlyph = withUniwind(IconGlyph, {
  style: {
    fromClassName: 'className',
  },
  size: {
    fromClassName: 'className',
    styleProperty: 'width',
  },
  color: {
    fromClassName: 'className',
    styleProperty: 'color',
  },
});

/**
 * A lucide icon styled by `className`. Inside a container that provides TextClassContext, such
 * as a Button, it takes the container's text classes under its own, so it matches the label, and
 * the size of {@link IconClassContext} unless it names a size itself. An explicit `size` or `color`
 * wins over a class.
 */
function Icon({ className, style, ...props }: IconProps): ReactNode {
  const textClass = useContext(TextClassContext);
  const iconClass = useContext(IconClassContext);
  const { size, color } = props;
  const namesSize = size !== undefined || className?.includes('size-') === true;

  // Uniwind lays the caller's style over the classes' style, and the svg's style outranks its own
  // width and colour, so an explicit size or colour goes in as style too. TextStyle, because the
  // colour is not a ViewStyle key, and the svg's style is typed as one.
  const explicitStyle: TextStyle = {
    ...(size === undefined ? {} : { width: Number(size), height: Number(size) }),
    ...(color === undefined ? {} : { color }),
  };

  return (
    <StyledIconGlyph
      className={cn('text-foreground', textClass, namesSize ? undefined : iconClass, className)}
      style={[explicitStyle, style]}
      {...props}
    />
  );
}

export { Icon, IconClassContext };
export type { IconProps };
