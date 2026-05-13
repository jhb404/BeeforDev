export function SecurityCard() {
  return (
    <div className="card settings-security">
      <h2>Segurança</h2>
      <ul style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.8 }}>
        <li>Senha gravada no Windows Credential Manager (via keytar).</li>
        <li>
          Cookies / localStorage do Beefor salvos em <code>storageState</code> isolado.
        </li>
        <li>MFA / CAPTCHA pedem login manual — app não burla autenticação.</li>
      </ul>
    </div>
  );
}
