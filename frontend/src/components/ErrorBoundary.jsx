import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-wrapper">
          <div className="error-boundary-card">
            <div className="error-boundary-header">
              <div className="error-boundary-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2>Something went wrong</h2>
              <p>An unexpected UI error occurred while rendering this component.</p>
            </div>

            <div className="error-boundary-message-box">
              <strong>Error Message:</strong>
              <p>{this.state.error?.message || "Unknown Application Error"}</p>
            </div>

            <div className="error-boundary-actions">
              <button className="btn-primary" onClick={this.handleReset}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon-sm">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Try Again
              </button>
              <button className="btn-secondary" onClick={this.handleReload}>
                Reload Application
              </button>
            </div>

            <div className="error-boundary-details">
              <button
                type="button"
                className="btn-toggle-details"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
              >
                {this.state.showDetails ? "Hide Technical Details ▲" : "View Technical Details ▼"}
              </button>

              {this.state.showDetails && (
                <div className="error-stack-trace">
                  <code>{this.state.error?.stack}</code>
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <strong>Component Stack:</strong>
                      <code>{this.state.errorInfo.componentStack}</code>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
