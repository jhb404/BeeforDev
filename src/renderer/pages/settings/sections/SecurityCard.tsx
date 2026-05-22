export function SecurityCard() {
  return (
    <div className="card settings-security">
      <h2>Seguranca</h2>
      <ul className="settings-security__list">
        <li>Senha gravada no Windows Credential Manager (via keytar).</li>
        <li>
          Cookies / localStorage do Beefor salvos em <code>storageState</code> isolado.
        </li>
        <li>MFA / CAPTCHA pedem login manual; app nao burla autenticacao.</li>
      </ul>
    </div>
  );
}
