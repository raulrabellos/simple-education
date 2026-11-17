import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carrega dados da API e controla os estados de carregamento e erro.
 * Uso: const { data, loading, error, reload } = useApi(() => api.content.subjects(), []);
 * Respostas que chegam depois de o componente mudar de dados são descartadas.
 */
export function useApi(loader, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const requestId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(loader, deps);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await load();
      if (id === requestId.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (id === requestId.current) setState({ data: null, loading: false, error });
    }
  }, [load]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data })) };
}
