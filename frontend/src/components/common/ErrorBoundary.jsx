import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-rose-900/40 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">Application Encountered an Error</h2>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              An unexpected interface error occurred. You can reload this view or navigate back to the main system dashboard.
            </p>
            {this.state.error?.message && (
              <div className="p-3 mb-6 bg-slate-950/80 border border-slate-800 rounded-lg text-left text-xs font-mono text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Page
              </button>
              <a
                href="/"
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-slate-200 text-sm transition-colors text-center"
              >
                Go to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
