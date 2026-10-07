import { useCallback, useEffect, useState } from 'react';
import { api, type Page } from '../api';

export function usePaged<T>(path: string, limit = 10) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Page<T> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const sep = path.includes('?') ? '&' : '?';
    setLoading(true);
    try {
      setResult(await api.get<Page<T>>(`${path}${sep}page=${page}&limit=${limit}`));
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [path]);

  return { result, error, loading, setPage, reload: load };
}
