import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last-resort UI guard: catches render-time exceptions anywhere below it so a bug in one
 * tab/widget shows a recoverable screen instead of a blank white app. Does not catch errors
 * in event handlers or async code (React boundaries never do) — those still use try/catch.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86l-8.18 14.18A1 1 0 003 19.5h18a1 1 0 00.89-1.46L13.71 3.86a1 1 0 00-1.42 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Something went wrong</h2>
              <p className="text-sm text-slate-500 mt-1">
                This screen hit an unexpected error. Reloading usually fixes it; your attendance and visit data is safe on the server.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary text-sm w-full"
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
