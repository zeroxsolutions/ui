import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

interface DemoBoundaryProps {
  /** The demo's name, shown with the error. */
  name: string;
  children: ReactNode;
}

interface DemoBoundaryState {
  error: Error | undefined;
}

/**
 * Draws the error a demo threw, with its message, in place of the demo, so a broken demo shows in the
 * frame rather than leaving it blank. React catches a render error only in a class component.
 */
class DemoBoundary extends Component<DemoBoundaryProps, DemoBoundaryState> {
  override state: DemoBoundaryState = { error: undefined };

  static getDerivedStateFromError(error: unknown): DemoBoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`The ${this.props.name} demo threw`, error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (error === undefined) return this.props.children;
    return (
      <View accessible role="alert" className="border-destructive gap-1 rounded-md border p-4" testID="demo-error">
        <Text className="font-sans-semibold text-destructive">The {this.props.name} demo threw</Text>
        <Text className="text-destructive text-sm">{error.message}</Text>
      </View>
    );
  }
}

export { DemoBoundary };
