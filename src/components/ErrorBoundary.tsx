import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-50">
          <div className="max-w-md w-full bg-white border border-neutral-200 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <span className="text-red-600 text-xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-semibold text-neutral-900">Something went wrong</h2>
            <p className="text-sm text-neutral-600">
              An unexpected error occurred while loading this page.
            </p>
            {this.state.error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 text-left font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 text-sm border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
              >
                Try again
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="px-4 py-2 text-sm bg-[#0f2749] text-white hover:bg-[#0f2749]/90"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
