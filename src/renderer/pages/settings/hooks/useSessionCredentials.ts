import { useEffect, useState } from 'react';
import { getError } from '@shared/result';
import { useIpc } from '../../../services/ipc';
import { useToast } from '../../../app/providers/ToastProvider';

/** Estado e ações das credenciais Beefor (Credential Manager). */
export function useSessionCredentials() {
  const { session: sessionClient } = useIpc();
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  useEffect(() => {
    void sessionClient.getCredentials().then((c) => {
      if (c) {
        setSavedEmail(c.email);
        setEmail(c.email);
      }
    });
  }, [sessionClient]);

  const save = async () => {
    if (!email || !password) {
      showToast({ kind: 'err', msg: 'Preencha e-mail e senha.' });
      return;
    }
    const res = await sessionClient.saveCredentials({ email, password });
    showToast({
      kind: res.ok ? 'ok' : 'err',
      msg: res.ok ? 'Credenciais salvas no Credential Manager.' : `Erro: ${getError(res)}`,
    });
    if (res.ok) {
      setSavedEmail(email);
      setPassword('');
    }
  };

  const clear = async () => {
    const res = await sessionClient.clearCredentials();
    showToast({
      kind: res.ok ? 'ok' : 'err',
      msg: res.ok ? 'Credenciais removidas.' : `Erro: ${getError(res)}`,
    });
    if (res.ok) {
      setSavedEmail(null);
      setEmail('');
      setPassword('');
    }
  };

  return { email, password, savedEmail, setEmail, setPassword, save, clear };
}
