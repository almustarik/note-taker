import { useEffect, useState } from 'react';

// Render's free plan puts the API to sleep, so the first request can take up to a minute
export function useSlow(active = true, ms = 4000) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (!active) return;
    const timer = setTimeout(() => setSlow(true), ms);
    return () => clearTimeout(timer);
  }, [active, ms]);
  return slow;
}

export const slowMessage = 'The server is waking up. This can take up to a minute the first time.';

export function FullPageLoader({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  const slow = useSlow(!error);
  return (
    <div className="boot" role="status">
      <div className="brand">Notes</div>
      {error ? (
        <>
          <p className="error">{error}</p>
          <button className="button primary" onClick={onRetry}>
            Try again
          </button>
        </>
      ) : (
        <>
          <span className="spinner" aria-hidden />
          <p>{slow ? slowMessage : 'Loading…'}</p>
        </>
      )}
    </div>
  );
}

export function ListSkeleton({ rows = 3, variant = 'rows' }: { rows?: number; variant?: 'rows' | 'sheets' }) {
  const slow = useSlow();
  return (
    <div role="status" aria-label="Loading">
      <div className={variant === 'sheets' ? 'board' : 'skeleton-list'}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={variant === 'sheets' ? 'sheet skeleton-card' : 'skeleton-row'}>
            <span className="skeleton-line short" />
            <span className="skeleton-line" />
            <span className="skeleton-line medium" />
          </div>
        ))}
      </div>
      {slow && <p className="muted small slow-hint">{slowMessage}</p>}
    </div>
  );
}
