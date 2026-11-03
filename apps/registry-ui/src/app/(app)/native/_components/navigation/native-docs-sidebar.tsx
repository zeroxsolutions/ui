'use client';

import type { Root } from 'fumadocs-core/page-tree';
import type { ReactNode } from 'react';

import { DocsSidebar } from '@zeroxsolutions/ui/site/components/navigation/docs-sidebar';
import { useRememberedEngine } from '@zeroxsolutions/ui/site/hooks/use-remembered-choice';
import type { NativeEngine } from '@zeroxsolutions/ui/site/types/native-engine';

interface NativeDocsSidebarProps {
  /** The native tree under each engine. */
  trees: Record<NativeEngine, Root>;
}

/** The native sidebar on a page whose path holds no engine: its component links go to the engine the reader last read. */
function NativeDocsSidebar({ trees }: NativeDocsSidebarProps): ReactNode {
  return <DocsSidebar tree={trees[useRememberedEngine()]} />;
}

export { NativeDocsSidebar };
