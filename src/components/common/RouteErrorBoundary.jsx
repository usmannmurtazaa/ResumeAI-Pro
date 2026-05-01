import React from 'react';
import ErrorBoundary from './ErrorBoundary';

const RouteErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Something went wrong
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Please try refreshing the page
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

export default RouteErrorBoundary;