import * as AvatarPrimitive from '@rn-primitives/avatar';
import { createContext, useContext, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import { TextClassContext } from './text';

type AvatarSize = 'default' | 'sm' | 'lg';

/** `none` while the avatar holds no image, and `error` once the image failed. */
type AvatarImageStatus = 'none' | 'loading' | 'loaded' | 'error';

type AvatarState = {
  size: AvatarSize;
  alt: string;
  /** How the image stands: the fallback stops showing once it has loaded. */
  status: AvatarImageStatus;
  setStatus: (status: AvatarImageStatus) => void;
};

/** What the parts of an Avatar share: its size, its alt, and how its image stands. */
const AvatarContext = createContext<AvatarState>({ size: 'default', alt: '', status: 'none', setStatus: () => {} });

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
  const [status, setStatus] = useState<AvatarImageStatus>('none');
  return (
    <AvatarContext.Provider value={{ size, alt, status, setStatus }}>
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
  const { setStatus } = useContext(AvatarContext);

  const sourceKey = JSON.stringify(source);
  useEffect(() => {
    setStatus('loading');
    return () => setStatus('none');
  }, [sourceKey, setStatus]);

  return (
    <AvatarPrimitive.Image
      className={cn('aspect-square size-full cn-avatar-image', className)}
      source={source}
      onLoadingStatusChange={(status) => {
        setStatus(status === 'loaded' ? 'loaded' : status === 'error' ? 'error' : 'loading');
        onLoadingStatusChange?.(status);
      }}
      {...props}
    />
  );
}

/**
 * What shows in place of the image until it has loaded, and for good if there is none or it failed,
 * usually initials as a Text child. It is announced as an image named by the avatar's `alt`, except
 * while an image is loading, when the image carries the name.
 */
function AvatarFallback({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const { size, alt, status } = useContext(AvatarContext);
  if (status === 'loaded') return null;
  // The image carries the alt while it loads, so the fallback keeps quiet and the name is read once.
  const loading = status === 'loading';

  return (
    <TextClassContext.Provider value={cn('text-sm cn-avatar-fallback/text', size === 'sm' && 'text-xs')}>
      <View
        accessible={!loading}
        aria-hidden={loading || undefined}
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
