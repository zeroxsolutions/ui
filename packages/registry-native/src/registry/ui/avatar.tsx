import * as AvatarPrimitive from '@rn-primitives/avatar';
import { createContext, useContext, type ReactNode } from 'react';
import { cn } from '../lib/utils';
import { TextClassContext } from './text';

type AvatarSize = 'default' | 'sm' | 'lg';

/** The size of the Avatar around a part, which sets the size of the fallback's text. */
const AvatarSizeContext = createContext<AvatarSize>('default');

// A `cn-<slot>` token stands for that Vega slot's view classes and `cn-<slot>/text` for its text
// classes, and `@size=sm` for the classes behind the small size; the registry build replaces each
// with the classes translated for the target engine.

type AvatarProps = AvatarPrimitive.RootProps & {
  /** `sm` draws 24px and `lg` 40px; the default is 32px. */
  size?: AvatarSize;
};

/**
 * A round picture of a person or an account. Compose it from an AvatarImage and an AvatarFallback.
 * `alt` names the avatar: the image carries it, and so does the fallback when it stands in.
 */
function Avatar({ className, size = 'default', ...props }: AvatarProps): ReactNode {
  return (
    <AvatarSizeContext.Provider value={size}>
      <AvatarPrimitive.Root
        className={cn(
          'flex shrink-0 overflow-hidden cn-avatar',
          size === 'sm' && 'cn-avatar@size=sm',
          size === 'lg' && 'cn-avatar@size=lg',
          className,
        )}
        {...props}
      />
    </AvatarSizeContext.Provider>
  );
}

/** The picture. It draws nothing until it has loaded and nothing if it fails, so the fallback can show. */
function AvatarImage({ className, ...props }: AvatarPrimitive.ImageProps): ReactNode {
  return <AvatarPrimitive.Image className={cn('aspect-square size-full cn-avatar-image', className)} {...props} />;
}

/** What shows in place of the image when there is none or it failed, usually initials as a Text child. */
function AvatarFallback({ className, ...props }: AvatarPrimitive.FallbackProps): ReactNode {
  const size = useContext(AvatarSizeContext);
  return (
    <TextClassContext.Provider value={cn('text-sm cn-avatar-fallback/text', size === 'sm' && 'text-xs')}>
      <AvatarPrimitive.Fallback
        accessible
        className={cn('size-full items-center justify-center cn-avatar-fallback', className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Avatar, AvatarFallback, AvatarImage };
export type { AvatarProps };
