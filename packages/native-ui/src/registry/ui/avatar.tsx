import * as AvatarPrimitive from '@rn-primitives/avatar';
import { cva } from 'class-variance-authority';
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import { IconClassContext } from './icon';
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

/** Whether an Avatar sits in an AvatarGroup, which overlaps it on the one before and edges it in the background colour. */
const AvatarGroupContext = createContext(false);

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
  const grouped = useContext(AvatarGroupContext);
  return (
    <AvatarContext.Provider value={{ size, alt, status, setStatus }}>
      <AvatarPrimitive.Root
        className={cn(
          // The image and the fallback round themselves, so an AvatarBadge can sit over the edge unclipped.
          'relative flex shrink-0 cn-avatar',
          size === 'sm' && 'cn-avatar@size=sm',
          size === 'lg' && 'cn-avatar@size=lg',
          grouped && '-ml-2 border-2 border-background',
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

/** The dot at each avatar size, its 2px edge included. */
const avatarBadgeVariants = cva(
  'absolute -right-0.5 -bottom-0.5 z-10 items-center justify-center rounded-full border-2 cn-avatar-badge',
  {
    variants: {
      size: { sm: 'size-3', default: 'size-3.5', lg: 'size-4' } satisfies Record<AvatarSize, string>,
    },
  },
);

/** An icon inside the dot; the small avatar's dot is too small to hold one. */
const avatarBadgeIconVariants = cva('', {
  variants: {
    size: { sm: 'hidden', default: 'size-2', lg: 'size-2' } satisfies Record<AvatarSize, string>,
  },
});

/**
 * A dot on the avatar's bottom right corner, in the primary colour with an edge in the background colour,
 * such as a presence or an unread mark. An Icon inside takes 8px, and none shows on the `sm` avatar.
 * It is not announced; say what it marks in the avatar's `alt`.
 */
function AvatarBadge({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const { size } = useContext(AvatarContext);
  return (
    <TextClassContext.Provider value="cn-avatar-badge/text">
      <IconClassContext.Provider value={avatarBadgeIconVariants({ size })}>
        <View aria-hidden className={cn(avatarBadgeVariants({ size }), className)} {...props} />
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

function avatarSizeOf(child: ReactNode): AvatarSize | undefined {
  if (!isValidElement<AvatarProps>(child) || child.type !== Avatar) return undefined;
  return child.props.size ?? 'default';
}

/** What an AvatarGroupCount reads from its AvatarGroup: the size of the largest avatar beside it. */
const AvatarSizeContext = createContext<AvatarSize>('default');

/**
 * A row of avatars, each overlapping the one before by 8px and edged in the background colour, with an
 * AvatarGroupCount at its end for the people it leaves out. Its Avatars and the count are its direct children.
 */
function AvatarGroup({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  const sizes = Children.toArray(children).map(avatarSizeOf);
  const size: AvatarSize = sizes.includes('lg') ? 'lg' : sizes.includes('sm') ? 'sm' : 'default';
  return (
    <AvatarGroupContext.Provider value={true}>
      <AvatarSizeContext.Provider value={size}>
        {/* Each child pulls itself 8px left, and the padding gives the first one that room back. */}
        <View className={cn('flex-row pl-2', className)} {...props}>
          {children}
        </View>
      </AvatarSizeContext.Provider>
    </AvatarGroupContext.Provider>
  );
}

/** An icon inside an AvatarGroupCount, by the size of the group's avatars. */
const avatarGroupCountIconVariants = cva('', {
  variants: {
    size: { sm: 'size-3', default: 'size-4', lg: 'size-5' } satisfies Record<AvatarSize, string>,
  },
});

/**
 * The circle at the end of an AvatarGroup, as large as its avatars, holding how many more there are as a
 * Text, such as `+3`, or an Icon.
 */
function AvatarGroupCount({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  const size = useContext(AvatarSizeContext);
  return (
    <TextClassContext.Provider value="cn-avatar-group-count/text">
      <IconClassContext.Provider value={avatarGroupCountIconVariants({ size })}>
        <View
          className={cn(
            'relative -ml-2 shrink-0 items-center justify-center border-2 border-background cn-avatar-group-count',
            size === 'sm' && 'cn-avatar-group-count@size=sm',
            size === 'lg' && 'cn-avatar-group-count@size=lg',
            className,
          )}
          {...props}
        />
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

export { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage };
export type { AvatarProps };
