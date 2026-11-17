import { useEffect } from 'react';

/** Atualiza o título da aba do navegador. */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Simple Education` : 'Simple Education';
  }, [title]);
}
