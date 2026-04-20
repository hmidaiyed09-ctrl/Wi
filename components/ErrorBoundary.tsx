import React, { Component } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends Component<{}, ErrorBoundaryState> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          backgroundColor: '#f8f9fa',
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>Something went wrong</h2>
          <div style={{
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '600px',
            textAlign: 'left',
            marginBottom: '20px',
          }}>
            <p><strong>Error:</strong> {this.state.error?.message || 'Unknown error'}</p>
            {this.state.errorInfo && (
              <div>
                <p><strong>Component Stack:</strong></p>
                <pre style={{
                  backgroundColor: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '4px',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}