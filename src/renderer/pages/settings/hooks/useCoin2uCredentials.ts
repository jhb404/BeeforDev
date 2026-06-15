import { useEffect, useState } from 'react';
import { getError } from '@shared/result';
import { useIpc } from '../../../services/ipc';
import { useToast } from '../../../app/providers/ToastProvider';
import { APP_EVENTS, emitAppEvent } from '../../../app/events';

/** Estado e ações das credenciais Coin2U (+ verify pós-save). Emite COIN2U_CHANGED. */
export function useCoin2uCredentials() {
  const { coin2u: coin2uClient } = useIpc();
  const showToast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    void coin2uClient.getCreds().then((c) => {
      if (c) {
        setSavedEmail(c.email);
        setEmail(c.email);
        setConnected(!!c.connected);
      }
    });
  }, [coin2uClient]);

  const save = async () => {
    if (!email || !password) {
      showToast({ kind: 'err', msg: 'Coin2U: preencha e-mail e senha.' });
      return;
    }
    const res = await coin2uClient.saveCreds({ email, password });
    if (!res.ok) {
      showToast({ kind: 'err', msg: `Erro Coin2U: ${getError(res)}` });
      return;
    }
    setSavedEmail(email);
    setPassword('');
    showToast({ kind: 'ok', msg: 'Coin2U: credenciais salvas. Testando login…' });
    const verify = await coin2uClient.verify();
    if (verify.ok && verify.data) {
      setConnected(true);
      showToast({ kind: 'ok', msg: 'Coin2U: conectado.' });
    } else {
      setConnected(false);
      showToast({ kind: 'err', msg: `Coin2U: login falhou — ${getError(verify)}` });
    }
    emitAppEvent(APP_EVENTS.COIN2U_CHANGED);
  };

  const clear = async () => {
    const res = await coin2uClient.clearCreds();
    showToast({
      kind: res.ok ? 'ok' : 'err',
      msg: res.ok ? 'Credenciais Coin2U removidas.' : `Erro Coin2U: ${getError(res)}`,
    });
    if (res.ok) {
      setSavedEmail(null);
      setEmail('');
      setPassword('');
      setConnected(false);
      emitAppEvent(APP_EVENTS.COIN2U_CHANGED);
    }
  };

  return { email, password, savedEmail, connected, setEmail, setPassword, save, clear };
}
