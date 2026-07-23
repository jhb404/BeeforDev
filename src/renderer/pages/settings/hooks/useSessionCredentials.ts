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
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    void sessionClient.getCredentials().then((c) => {
      if (c) {
        setSavedEmail(c.email);
        setEmail(c.email);
        setConnected(!!c.connected);
      }
    });
    // Mantém o status em sincronia com o statusBus (conecta/expira/reconecta).
    const off = sessionClient.onStatus((s) => setConnected(s === 'connected'));
    return off;
  }, [sessionClient]);

  const save = async () => {
    if (!email || !password) {
      showToast({ kind: 'err', msg: 'Preencha e-mail e senha.' });
      return;
    }
    const res = await sessionClient.saveCredentials({ email, password });
    if (!res.ok) {
      showToast({ kind: 'err', msg: `Erro: ${getError(res)}` });
      return;
    }
    setSavedEmail(email);
    setPassword('');
    showToast({ kind: 'ok', msg: 'Credenciais salvas. Testando login…' });
    // Igual ao Coin2u: valida login logo após salvar e reflete o status.
    const login = await sessionClient.login();
    if (login.ok) {
      setConnected(true);
      showToast({ kind: 'ok', msg: 'Beefor: conectado.' });
    } else {
      setConnected(false);
      showToast({ kind: 'err', msg: `Beefor: login falhou — ${getError(login)}` });
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
      setConnected(false);
    }
  };

  const loginGoogle = async () => {
    showToast({ kind: 'ok', msg: 'Abrindo login do Google…' });
    const res = await sessionClient.loginGoogle();
    if (res.ok) {
      setConnected(true);
      showToast({ kind: 'ok', msg: 'Beefor: conectado com Google.' });
    } else {
      setConnected(false);
      showToast({ kind: 'err', msg: getError(res) });
    }
  };

  return {
    email,
    password,
    savedEmail,
    connected,
    setEmail,
    setPassword,
    save,
    clear,
    loginGoogle,
  };
}
