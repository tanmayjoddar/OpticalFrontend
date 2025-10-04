import React from 'react';

interface ErrorBoundaryState { error: Error | null; info: any; }

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{ fallback?: React.ReactNode }>, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, info: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState { return { error, info: null }; }

  componentDidCatch(error: Error, info: any) { this.setState({ error, info }); }

  reset = () => { this.setState({ error: null, info: null }); };

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-sm space-y-4 max-w-lg mx-auto">
          <div className="text-red-600 font-semibold">Something went wrong.</div>
          <pre className="bg-red-50 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap border border-red-200">
            {this.state.error.message}\n{this.state.error.stack?.split('\n').slice(0,5).join('\n')}
          </pre>
          <button className="px-3 py-1 rounded bg-primary text-white text-xs" onClick={this.reset}>Reset</button>
        </div>
      );
    }
    return this.props.children;
  }
}
