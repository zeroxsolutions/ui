import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { forwardRef, useId, type ComponentProps, type ReactNode } from 'react';
import { Image, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { cn } from '../../lib/utils';
import { Icon } from '../../ui/icon';

/** The side of one square of the checkerboard, half the web's `calc(var(--spacing) * 4)` tile. */
const CHECKER_CELL = 8;

/**
 * Every other square of a checkerboard, in `color`, across the whole of its parent. It takes an icon's props
 * so that Icon draws it, which resolves a colour class to `color` on a phone; on the web the class reaches the
 * svg itself, which draws `currentColor`. Its `size` is ignored, and `size-full` stretches it through its style.
 */
const Checkerboard: LucideIcon = forwardRef<Svg, LucideProps>(function Checkerboard(
  { color = 'currentColor', size: _size, ...props },
  ref,
) {
  const id = `checkerboard-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg ref={ref} width="100%" height="100%" {...props}>
      <Defs>
        <Pattern id={id} width={CHECKER_CELL * 2} height={CHECKER_CELL * 2} patternUnits="userSpaceOnUse">
          <Rect x={CHECKER_CELL} y={0} width={CHECKER_CELL} height={CHECKER_CELL} fill={color} />
          <Rect x={0} y={CHECKER_CELL} width={CHECKER_CELL} height={CHECKER_CELL} fill={color} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
});

/**
 * A frame that shows an image contained within it, over a checkerboard of the muted and background colours,
 * so transparent pixels read clearly. It fills the space it is given, so the consumer sizes its wrapper.
 * Compose the image as `ImagePreviewImage`:
 *
 *   <ImagePreview>
 *     <ImagePreviewImage src={src} alt="Logo" />
 *   </ImagePreview>
 */
function ImagePreview({ className, children, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <View
      className={cn('cn-image-preview bg-background size-full items-center justify-center overflow-hidden', className)}
      {...props}
    >
      {/* React Native draws no CSS gradient, so the web's bg-checkerboard is an svg pattern laid under the image. */}
      <View aria-hidden pointerEvents="none" className="absolute inset-0">
        <Icon as={Checkerboard} className="text-muted size-full" />
      </View>
      {children}
    </View>
  );
}

/**
 * The previewed image, centred and scaled down to fit the frame, never up, as the web's `max-w-full
 * max-h-full` keeps a small image at its own size. `alt` defaults to empty, which hides it from a screen
 * reader as decorative; given one, it is an image of that name. `src` is read into `source`, since React
 * Native for Web reads only `source`.
 */
function ImagePreviewImage({ alt = '', src, source, className, ...props }: ComponentProps<typeof Image>): ReactNode {
  const named = alt !== '';
  return (
    <Image
      source={source ?? (src === undefined ? undefined : { uri: src })}
      alt={alt}
      accessible={named}
      role={named ? 'img' : undefined}
      aria-label={named ? alt : undefined}
      aria-hidden={!named}
      resizeMode="center"
      className={cn('h-full w-full', className)}
      {...props}
    />
  );
}

export { ImagePreview, ImagePreviewImage };
