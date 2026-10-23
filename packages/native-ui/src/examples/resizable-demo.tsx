import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Text } from '@/components/ui/text';

function ResizableDemo(): ReactNode {
  return (
    <ResizablePanelGroup orientation="horizontal" className="border-border max-w-sm rounded-lg border">
      <ResizablePanel defaultSize="50%">
        <View className="h-[200px] items-center justify-center p-6">
          <Text className="font-semibold">One</Text>
        </View>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="50%">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel defaultSize="25%">
            <View className="h-full items-center justify-center p-6">
              <Text className="font-semibold">Two</Text>
            </View>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="75%">
            <View className="h-full items-center justify-center p-6">
              <Text className="font-semibold">Three</Text>
            </View>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export { ResizableDemo };
