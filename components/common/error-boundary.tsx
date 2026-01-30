'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Callback when error caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show error details (useful for development) */
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showErrorDetails: boolean;
}

/**
 * ErrorBoundary Component
 * Catches React rendering errors and displays a fallback UI
 * Prevents entire app crash when a component fails
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({ errorInfo });

    // Call optional error callback (for error reporting services)
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    // Reset error state and try rendering children again
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false,
    });
  };

  toggleErrorDetails = (): void => {
    this.setState((prev) => ({ showErrorDetails: !prev.showErrorDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If custom fallback provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We encountered an unexpected error. Our team has been notified.
              </p>

              {/* Error details (collapsible, only shown if showDetails is true or in development) */}
              {(this.props.showDetails || process.env.NODE_ENV === 'development') &&
                this.state.error && (
                  <div className="text-left">
                    <button
                      onClick={this.toggleErrorDetails}
                      className="flex w-full items-center justify-between rounded-md bg-muted p-3 text-sm font-medium transition-colors hover:bg-muted/80"
                    >
                      <span>Error Details</span>
                      {this.state.showErrorDetails ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {this.state.showErrorDetails && (
                      <div className="mt-2 max-h-40 overflow-auto rounded-md bg-muted p-3">
                        <pre className="whitespace-pre-wrap break-all text-xs text-muted-foreground">
                          <strong>Error:</strong> {this.state.error.message}
                          {this.state.errorInfo?.componentStack && (
                            <>
                              {'\n\n'}
                              <strong>Component Stack:</strong>
                              {this.state.errorInfo.componentStack}
                            </>
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-center gap-3">
              <Button variant="outline" onClick={this.handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="default" onClick={() => window.location.href = '/'}>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
