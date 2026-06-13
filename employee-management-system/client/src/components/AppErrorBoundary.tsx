import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('React error boundary caught:', error, info);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="error-page-shell">
          <div className="error-card">
            <div className="error-badge">Application Error</div>
            <h1>Something went wrong</h1>
            <p>We hit an unexpected issue while rendering the app.</p>
            {isDev && this.state.error && (
              <pre className="error-stack">{this.state.error.stack || this.state.error.message}</pre>
            )}
            <div className="error-actions">
              <button className="btn btn-primary" onClick={this.handleRefresh}>
                Refresh Page
              </button>
              <button className="btn btn-secondary" onClick={this.handleHome}>
                Go To Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
