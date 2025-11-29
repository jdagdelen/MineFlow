import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
          <div className="max-w-2xl p-8 bg-red-900/30 border border-red-700 rounded-lg">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
            <p className="text-gray-300 mb-4">
              The application encountered an error. This usually happens when:
            </p>
            <ul className="list-disc list-inside mb-4 text-gray-300 space-y-1">
              <li>The Electron API is not available (try restarting the app)</li>
              <li>The MineFlow executable is not found</li>
              <li>There's a problem with the data file format</li>
            </ul>
            <details className="mb-4">
              <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                Show error details
              </summary>
              <pre className="mt-2 p-4 bg-gray-800 rounded text-xs overflow-auto">
                {this.state.error?.toString()}
                {'\n\n'}
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
