import { useState } from 'react';

export function useAsyncAction<TArgs extends unknown[], TResult>(action: (...args: TArgs) => Promise<TResult>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(...args: TArgs) {
    setLoading(true);
    setError(null);
    try {
      return await action(...args);
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : 'Não foi possível concluir a ação.';
      setError(message);
      throw unknownError;
    } finally {
      setLoading(false);
    }
  }

  return { run, loading, error, clearError: () => setError(null) };
}
