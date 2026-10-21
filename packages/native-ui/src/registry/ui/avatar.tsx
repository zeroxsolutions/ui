import * as AvatarPrimitive from '@rn-primitives/avatar';
import { createContext, useContext, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import { TextClassContext } from './text';

type AvatarSize = 'default' | 'sm' | 'lg';

type AvatarState = {
  size: AvatarSize;
  alt: string;
  /** Whether the image has loaded, which is when the fallback stops showing. */
  loaded: boolean;
  setLoaded: (loaded: boolean) => void;
};

/** What the parts of an Avatar share: its size, its alt, and whether its image has loaded. */
const AvatarContext = createContext<AvatarState>({ size: 'default', alt: '', loaded: false, setLoaded: () => {} });

// A `cn-<slot>` token stands for that slot's view classes and `cn-<slot>/text` for its text
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
function Avatar({ className, size = 'default', alt, ...props }: AvatarProps): ReactNode {
  const [loaded, setLoaded] = useState(false);
  return (
    <AvatarContext.Provider value={{ size, alt, loaded, setLoaded }}>
      <AvatarPrimitive.Root
        className={cn(
          'flex shrink-0 overflow-hidden cn-avatar',
          size === 'sm' && 'cn-avatar@size=sm',
          size === 'lg' && 'cn-avatar@size=lg',
          className,
        )}
        alt={alt}
        {...props}
      />
    </AvatarContext.Provider>
  );
}

/** The picture. It draws nothing if it fails to load, and the fallback shows until it has loaded. */
function AvatarImage({ className, onLoadingStatusChange, source, ...props }: AvatarPrimitive.ImageProps): ReactNode {
  const { setLoaded } = useContext(AvatarContext);

  const sourceKey = JSON.stringify(source);
  useEffect(() => {
    setLoaded(false);
    return () => setLoaded(false);
  }, [sourceKey, setLoaded]);

  return (
    <AvatarPrimitive.Image
      className={cn('aspect-square size-full cn-avatar-image', className)}
      source={source}
      onLoadingStatusChange={(status) => {
        setLoaded(status === 'loaded');
        onLoadingStatusChange?.(status);
      }}
      {...props}
    />
  );
}

/**
 * What shows in place of the image until it has loaded, and for good if there is none or it failed,
 * usually initials as a Text child. It is announced as an image named by the avatar's `alt`.
 */
function AvatarFallback({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const { size, alt, loaded } = useContext(AvatarContext);
  if (loaded) return null;

  return (
    <TextClassContext.Provider value={cn('text-sm cn-avatar-fallback/text', size === 'sm' && 'text-xs')}>
      <View
        accessible
        role="img"
        aria-label={alt}
        className={cn('absolute inset-0 items-center justify-center cn-avatar-fallback', className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Avatar, AvatarFallback, AvatarImage };
export type { AvatarProps };
