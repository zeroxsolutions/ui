import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { createContext, useContext, type ReactNode } from 'react';
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

function IconGlyph({ as: Glyph, ...props }: IconProps): ReactNode {
  return <Glyph {...props} />;
}

// The colour is read from `color`, not Uniwind's `accent-*`, so the text classes a Button hands
// its label colour the icon beside it too.
const StyledIconGlyph = withUniwind(IconGlyph, {
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
function Icon({ className, ...props }: IconProps): ReactNode {
  const textClass = useContext(TextClassContext);
  const iconClass = useContext(IconClassContext);
  const namesSize = props.size !== undefined || className?.includes('size-') === true;

  return (
    <StyledIconGlyph
      className={cn('text-foreground', textClass, namesSize ? undefined : iconClass, className)}
      {...props}
    />
  );
}

export { Icon, IconClassContext };
export type { IconProps };
