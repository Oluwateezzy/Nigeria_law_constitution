import { Component, type ReactNode } from 'react';
import { Text } from 'react-native';
import { reportCrash } from './report';

type CrashBoundaryProps = { children: ReactNode };
type CrashBoundaryState = { failed: boolean };

export class CrashBoundary extends Component<
  CrashBoundaryProps,
  CrashBoundaryState
> {
  state: CrashBoundaryState = { failed: false };

  componentDidCatch(error: Error): void {
    reportCrash(error);
    this.setState({ failed: true });
  }

  render(): ReactNode {
    if (this.state.failed) {
      return <Text>The screen did not load.</Text>;
    }
    return this.props.children;
  }
}
