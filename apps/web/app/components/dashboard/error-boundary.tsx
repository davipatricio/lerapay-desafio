'use client';

import { Component, type ReactNode } from 'react';

import { ErrorState } from './error-state';

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  compact?: boolean;
}

interface ErrorBoundaryState {
  error: unknown | null;
}

/**
 * Class error boundary that catches render/query errors thrown below it and
 * shows a safe retryable state instead of a blank or crashed section.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: unknown) {
    console.error('ErrorBoundary caught an error:', error);
  }

  private handleRetry = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          error={this.state.error}
          compact={this.props.compact}
          onRetry={this.props.onReset ? this.handleRetry : undefined}
        />
      );
    }
    return this.props.children;
  }
}
