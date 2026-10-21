import { FolderOpen } from 'lucide-react-native';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

function EmptyDemo(): ReactNode {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon as={FolderOpen} />
        </EmptyMedia>
        <EmptyTitle>No projects yet</EmptyTitle>
        <EmptyDescription>Create your first project to start tracking work.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>
          <Text>Create project</Text>
        </Button>
        <Button variant="link">
          <Text>Import a project</Text>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export { EmptyDemo };
