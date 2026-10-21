import { Children, isValidElement, type ReactNode } from 'react';

import type { NativeEngine } from '@/types/native-engine';

import { EngineTabsChooser } from './engine-tabs-chooser';

interface EngineTabProps {
  engine: NativeEngine;
  children: ReactNode;
}

/** One engine's part of an `EngineTabs`; it renders only through its `EngineTabs`. */
function EngineTab({ children }: EngineTabProps): ReactNode {
  return children;
}

interface EngineTabsProps {
  /** The engine the page is read under, which a native component page binds; absent on a page whose path holds no engine. */
  engine?: NativeEngine;
  /** One `EngineTab` per engine. */
  children: ReactNode;
}

/**
 * What a step says per engine. On a page read under an engine, only that engine's part; elsewhere, a tab
 * per engine, opened on the engine the reader last read.
 */
function EngineTabs({ engine, children }: EngineTabsProps): ReactNode {
  const panels = Children.toArray(children).flatMap((child) =>
    isValidElement<EngineTabProps>(child) && child.type === EngineTab
      ? [{ engine: child.props.engine, content: child.props.children }]
      : [],
  );

  if (engine) return <div data-slot="engine-tabs">{panels.find((panel) => panel.engine === engine)?.content}</div>;
  return <EngineTabsChooser panels={panels} />;
}

export { EngineTab, EngineTabs };
