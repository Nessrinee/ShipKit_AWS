/**
 * ErrorBoundary.jsx — React Error Boundary
 *
 * NEW (v2): Catches any unhandled React component errors.
 * Without this, a single component crash unmounts the entire app
 * and shows a blank white screen to the customer.
 *
 * Wrap the entire <Routes> tree in App.jsx with this component.
 */

import { Component } from 'react';
import { Link }      from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // In production: send to Sentry, LogRocket, or your own logging endpoint
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);

    // Optional: POST to backend error log
    // fetch('/api/client-errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message: error.message, stack: error.stack }),
    // }).catch(() => {});

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-bg">
          <div className="max-w-md w-full text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25
                            flex items-center justify-center text-3xl mx-auto mb-6">
              ⚠️
            </div>

            <h1 className="text-2xl font-display font-black text-heading mb-3">
              Something went wrong
            </h1>
            <p className="text-sm text-muted leading-relaxed mb-6">
              An unexpected error occurred. Your session and any purchases are unaffected.
              Try refreshing the page, or go back to the store.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 bg-accent text-black font-bold text-sm
                           rounded-lg hover:opacity-85 transition-opacity"
              >
                Try Again
              </button>
              <Link
                to="/"
                onClick={this.handleReset}
                className="px-6 py-2.5 border border-border text-text2 font-semibold
                           text-sm rounded-lg hover:border-accent transition-colors"
              >
                Back to Store
              </Link>
            </div>

            {/* Dev-mode stack trace */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left bg-surface border border-border
                                  rounded-xl p-4 text-xs font-mono text-muted">
                <summary className="cursor-pointer font-bold text-red-400 mb-2">
                  Error Details (dev only)
                </summary>
                <pre className="whitespace-pre-wrap break-all">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
