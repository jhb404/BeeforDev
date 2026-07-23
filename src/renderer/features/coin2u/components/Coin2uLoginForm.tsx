import { useState } from 'react';
import { useIpc } from '../../../services/ipc';
import { getError } from '@shared/result';

interface Props {
  /** Mensagem de contexto (ex.: erro de conexão) exibida acima do form. */
  reason?: string | null;
  /** Chamado após login validado com sucesso. Deve recarregar os dados. */
  onConnected: () => void | Promise<void>;
}

/**
 * Login inline do Coin2u dentro da modal. Aparece quando não há credenciais
 * salvas ou a conexão falhou — permite logar na hora sem sair pra Configurações.
 */
export function Coin2uLoginForm({ reason, onConnected }: Props) {
  const { coin2u: coin2uClient } = useIpc();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const save = await coin2uClient.saveCreds({ email, password });
      if (!save.ok) throw new Error(getError(save) || 'Falha ao salvar credenciais.');
      const verify = await coin2uClient.verify();
      if (!verify.ok || !verify.data) throw new Error(getError(verify) || 'Login recusado.');
      setPassword('');
      await onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="coin2u-login" onSubmit={submit}>
      <div className="coin2u-login__head">
        <strong>Conectar ao Coin2U</strong>
        <span>{reason || 'Entre com suas credenciais do Coin2U pra ver suas moedas.'}</span>
      </div>

      <div className="field">
        <label className="label">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="off"
          autoFocus
          disabled={busy}
        />
      </div>
      <div className="field">
        <label className="label">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="sua senha"
          autoComplete="off"
          disabled={busy}
        />
      </div>

      {error && <p className="coin2u-login__error">{error}</p>}

      <button type="submit" disabled={busy}>
        {busy ? 'Conectando…' : 'Conectar'}
      </button>
    </form>
  );
}
