'use client';

import { Component, type ReactNode } from 'react';

import { ErrorState } from './error-state';

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Class error boundary that catches render/query errors thrown below it and
 * shows a friendly retryable state instead of a blank or crashed section.
 * The optional `onReset` lets the boundary clear cached errors (e.g. via a
 * query client reset) when the user retries.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('ErrorBoundary caught an error:', error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return <ErrorState onRetry={this.props.onReset ? this.handleRetry : undefined} />;
    }
    return this.props.children;
  }
}
