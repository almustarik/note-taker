import { useEffect, useState, type ReactNode } from 'react';

interface FunctionalErrorBoundaryProps {
  children: ReactNode;
}

export default function ErrorBoundary({ children }: FunctionalErrorBoundaryProps) {
  const [capturedError, setCapturedError] = useState<Error | null>(null);

  useEffect(() => {
    const handleGlobalWindowError = (event: ErrorEvent) => {
      setCapturedError(event.error instanceof Error ? event.error : new Error(event.message));
    };

    const handleUnhandledPromiseRejection = (event: PromiseRejectionEvent) => {
      const errorReason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      setCapturedError(errorReason);
    };

    window.addEventListener('error', handleGlobalWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledPromiseRejection);

    return () => {
      window.removeEventListener('error', handleGlobalWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledPromiseRejection);
    };
  }, []);

  if (capturedError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'inherit' }}>
        <h2>Application Error Occurred</h2>
        <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{capturedError.message}</p>
        <button
          onClick={() => {
            setCapturedError(null);
            window.location.reload();
          }}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            background: '#2563eb',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
