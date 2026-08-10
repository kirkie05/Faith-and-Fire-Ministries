import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration failed: ', err);
    });
  });
}

// Global error catcher for errors that happen outside React
window.addEventListener('error', (e) => {
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="padding: 20px; background: #fee2e2; color: #991b1b; font-family: monospace;">
      <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">Global Error Caught</h1>
      <p><strong>Message:</strong> ${e.message}</p>
      <pre style="margin-top: 10px; white-space: pre-wrap; font-size: 12px; background: #fca5a5; padding: 10px; border-radius: 4px;">${e.error?.stack || 'No stack trace'}</pre>
    </div>`;
  }
});

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  info: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    info: null
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
    console.error("React Error Boundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#fee2e2', color: '#991b1b', fontFamily: 'monospace', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>App Crashed (White Screen Error)</h1>
          <p style={{ marginBottom: '8px' }}><strong>Error:</strong> {this.state.error?.message}</p>
          <pre style={{ background: '#fca5a5', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
            {this.state.error?.stack}
          </pre>
          {this.state.info && (
            <pre style={{ marginTop: '16px', background: '#fca5a5', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
              {this.state.info.componentStack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
