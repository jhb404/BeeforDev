import { useState } from 'react';
import { ConfigModal } from '../components/ConfigModal';

/** Atalho p/ o modal de Detalhes placeholder usado em vários cards. */
export function useDetalhes() {
  const [titulo, setTitulo] = useState<string | null>(null);
  const open = (t: string) => setTitulo(t);
  const node = titulo ? (
    <ConfigModal titulo={titulo} valor="" onClose={() => setTitulo(null)} />
  ) : null;
  return { open, node };
}
