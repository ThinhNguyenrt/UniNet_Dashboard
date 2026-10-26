import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../services/api';

export function useAdminResource<T>(loader: (signal: AbortSignal) => Promise<T>, revision = 0) {
  const [data, setData] = useState<T | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true); setError('');
      try { const value = await loader(controller.signal); if (!controller.signal.aborted) setData(value); }
      catch (cause) { if (!controller.signal.aborted) setError(getApiErrorMessage(cause)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [loader, attempt, revision]);
  return { data, loading, error, reload };
}
export function useDebouncedSearch(value: string) {
  const [search, setSearch] = useState(value);
  useEffect(() => { const timer = window.setTimeout(() => setSearch(value), 300); return () => window.clearTimeout(timer); }, [value]);
  return search;
}
