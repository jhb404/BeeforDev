interface CredentialsCardProps {
  email: string;
  password: string;
  savedEmail: string | null;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSave: () => void;
  onClear: () => void;
  coin2uEmail: string;
  coin2uPassword: string;
  coin2uSavedEmail: string | null;
  coin2uConnected: boolean;
  onCoin2uEmailChange: (v: string) => void;
  onCoin2uPasswordChange: (v: string) => void;
  onCoin2uSave: () => void;
  onCoin2uClear: () => void;
}

export function CredentialsCard(p: CredentialsCardProps) {
  return (
    <div className="card">
      <h2>Credenciais</h2>

      <p className="card-subtitle">Beefor</p>
      <div className="field">
        <label className="label">E-mail</label>
        <input
          type="email"
          value={p.email}
          onChange={(e) => p.onEmailChange(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="username"
        />
      </div>
      <div className="field">
        <label className="label">Senha</label>
        <input
          type="password"
          value={p.password}
          onChange={(e) => p.onPasswordChange(e.target.value)}
          placeholder={p.savedEmail ? '••••••••' : 'sua senha'}
          autoComplete="current-password"
        />
      </div>
      <div className="row">
        <button onClick={p.onSave}>Salvar</button>
        <button className="danger" onClick={p.onClear}>
          Remover
        </button>
      </div>
      {p.savedEmail && (
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
          Salvo: <strong>{p.savedEmail}</strong>
        </p>
      )}

      <div className="card-divider" />

      <p className="card-subtitle">Coin2U</p>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 10px' }}>
        Login separado do Beefor. Mostra suas moedas no topo.
      </p>
      <div className="field">
        <label className="label">E-mail</label>
        <input
          type="email"
          value={p.coin2uEmail}
          onChange={(e) => p.onCoin2uEmailChange(e.target.value)}
          placeholder="seu@email.com"
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label className="label">Senha</label>
        <input
          type="password"
          value={p.coin2uPassword}
          onChange={(e) => p.onCoin2uPasswordChange(e.target.value)}
          placeholder={p.coin2uSavedEmail ? '••••••••' : 'sua senha'}
          autoComplete="off"
        />
      </div>
      <div className="row">
        <button onClick={p.onCoin2uSave}>Salvar</button>
        <button className="danger" onClick={p.onCoin2uClear}>
          Remover
        </button>
      </div>
      {p.coin2uSavedEmail && (
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
          Salvo: <strong>{p.coin2uSavedEmail}</strong>
          {' · '}
          <span style={{ color: p.coin2uConnected ? 'var(--ok)' : 'var(--err)' }}>
            {p.coin2uConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </p>
      )}
    </div>
  );
}
