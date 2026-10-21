import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

function ThemeDemo(): ReactNode {
  return (
    <View className="gap-6">
      <View className="flex-row flex-wrap gap-4">
        <ThemeDemoSwatch className="bg-background">background</ThemeDemoSwatch>
        <ThemeDemoSwatch className="bg-foreground">foreground</ThemeDemoSwatch>
        <ThemeDemoSwatch className="bg-primary">primary</ThemeDemoSwatch>
        <ThemeDemoSwatch className="bg-secondary">secondary</ThemeDemoSwatch>
        <ThemeDemoSwatch className="bg-muted">muted</ThemeDemoSwatch>
        <ThemeDemoSwatch className="bg-accent">accent</ThemeDemoSwatch>
        <ThemeDemoSwatch className="bg-destructive">destructive</ThemeDemoSwatch>
        <ThemeDemoSwatch className="bg-border">border</ThemeDemoSwatch>
        <ThemeDemoSwatch className="bg-success">success</ThemeDemoSwatch>
        <ThemeDemoSwatch className="bg-warning">warning</ThemeDemoSwatch>
      </View>
      <View className="gap-1">
        <Text className="font-sans text-lg">Regular 400</Text>
        <Text className="font-sans-medium text-lg">Medium 500</Text>
        <Text className="font-sans-semibold text-lg">Semibold 600</Text>
        <Text className="font-sans-bold text-lg">Bold 700</Text>
      </View>
    </View>
  );
}

/** One colour token: a square filled by the class in `className`, over the token's name in `children`. */
function ThemeDemoSwatch({ className, children }: { className: string; children: string }): ReactNode {
  return (
    <View className="w-20 gap-1.5">
      <View className={cn('border-border h-10 rounded-md border', className)} />
      <Text className="text-muted-foreground text-xs">{children}</Text>
    </View>
  );
}

export { ThemeDemo };
