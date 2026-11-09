import type { ReactNode } from 'react';
import { View } from 'react-native';

import { FileTypeIcon } from '@/components/data-display/file-type-icon';
import { Text } from '@/components/ui/text';

const FILES = ['run.py', 'logo.png', 'Inter.woff2', 'notes.md', 'archive.zip'];

/** A list of file names, each with the icon FileTypeIcon resolves for its extension. */
function FileTypeIconDemo(): ReactNode {
  return (
    <View role="list" className="flex-col gap-2">
      {FILES.map((name) => (
        <View key={name} role="listitem" className="flex-row items-center gap-2">
          <FileTypeIcon name={name} className="text-muted-foreground size-4" />
          <Text className="text-sm">{name}</Text>
        </View>
      ))}
    </View>
  );
}

export { FileTypeIconDemo };
