import type { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import { IconClassContext } from './icon';
import { TextClassContext } from './text';

// A `cn-<slot>` token stands for that slot's view classes, `cn-<slot>/text` for its text classes and
// `cn-<slot>/icon` for the size it gives an icon; the registry build replaces each with the classes
// translated for the target engine.

/**
 * A keyboard key or a shortcut, drawn as a small muted cap as wide as its label. The label goes in as
 * a Text child, which takes the cap's text classes, and an Icon child is drawn at 12px.
 */
function Kbd({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return (
    <TextClassContext.Provider value="cn-kbd/text">
      <IconClassContext.Provider value="cn-kbd/icon">
        <View className={cn('flex-row items-center justify-center self-start cn-kbd', className)} {...props} />
      </IconClassContext.Provider>
    </TextClassContext.Provider>
  );
}

/** Kbds pressed together, such as Ctrl and B, laid out in a row. */
function KbdGroup({ className, ...props }: ComponentProps<typeof View>): ReactNode {
  return <View className={cn('flex-row items-center self-start cn-kbd-group', className)} {...props} />;
}

export { Kbd, KbdGroup };
