# Fluxo de Salvamento de Credenciais

**Descritivo Técnico — BeeforDev**

---

## 1. Stack envolvida

A persistência de credenciais utiliza a biblioteca `keytar` (native binding Node.js) que delega o armazenamento ao credential store nativo do sistema operacional:

- **Windows**: Credential Manager via DPAPI (`CryptProtectData`)
- **macOS**: Keychain Services
- **Linux**: libsecret / gnome-keyring

Credenciais em plaintext nunca tocam o disco do aplicativo. A criptografia é delegada ao OS, eliminando a necessidade de gerenciar chaves no próprio app.

---

## 2. Caminho ponta a ponta

### 2.1. Renderer dispara a ação

A UI React invoca a API exposta pelo preload script:

```ts
window.beefor.saveCredentials({ email, password })
```

Definida em `src/main/preload.ts` (linhas 30-31):

```ts
saveCredentials: (creds: Credentials): Promise<ActionResult> =>
  ipcRenderer.invoke(IPC.CREDS_SAVE, creds),
```

### 2.2. IPC bridge

`ipcRenderer.invoke` serializa o payload via structured clone e envia ao main process através do canal `IPC.CREDS_SAVE`. O renderer **não** tem acesso direto ao módulo `keytar` pois roda com `nodeIntegration: false` e `contextIsolation: true`.

### 2.3. Handler no main process

Em `src/main/ipc/handlers/credentials.handlers.ts` (linhas 8-15):

```ts
ipcMain.handle(IPC.CREDS_SAVE, async (_e, creds: Credentials) => {
  try {
    await saveCredentials(creds);
    return ok();
  } catch (err) {
    return fail(err);
  }
});
```

O handler envolve a operação em `try/catch` e retorna um `Result<T>` padronizado (`ok()` ou `fail()`), evitando vazamento de stack traces para o renderer.

### 2.4. Persistência via keytar

Em `src/main/secureStorage.ts` (linhas 6-10):

```ts
export async function saveCredentials(creds: Credentials): Promise<void> {
  await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_EMAIL, creds.email);
  await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_PASSWORD, creds.password);
  logger.info('Credentials saved to OS keychain');
}
```

Duas entradas separadas no keychain do OS:

| service     | account           | value             |
|-------------|-------------------|-------------------|
| `beefor-dev`| `beefor-email`    | email do usuário  |
| `beefor-dev`| `beefor-password` | senha do usuário  |

Constantes em `src/shared/constants.ts` (linhas 10-12):

```ts
export const KEYTAR_SERVICE = 'beefor-dev';
export const KEYTAR_ACCOUNT_EMAIL = 'beefor-email';
export const KEYTAR_ACCOUNT_PASSWORD = 'beefor-password';
```

---

## 3. Comportamento do OS (Windows)

A chamada `keytar.setPassword` aciona a Win32 API `CredWriteW`. Fluxo interno:

1. Recebe o blob plaintext.
2. DPAPI (`CryptProtectData`) criptografa o blob com chave derivada do perfil do usuário (LSA secret + master key vinculada ao SID).
3. Salva o blob criptografado em `%LOCALAPPDATA%\Microsoft\Credentials\`.
4. Decrypt funciona somente quando logado como o mesmo usuário Windows. Outro usuário na mesma máquina **não** consegue ler a credencial.

Verificação visual: **Painel de Controle → Gerenciador de Credenciais → Credenciais Genéricas → `beefor-dev`**.

---

## 4. Leitura das credenciais

Em `src/main/secureStorage.ts` (linhas 12-17):

```ts
export async function getCredentials(): Promise<Credentials | null> {
  const email = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_EMAIL);
  const password = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_PASSWORD);
  if (!email || !password) return null;
  return { email, password };
}
```

**IMPORTANTE**: o handler `CREDS_GET` só retorna o email para o renderer:

```ts
ipcMain.handle(IPC.CREDS_GET, async () => {
  const c = await getCredentials();
  return c ? { email: c.email } : null;
});
```

A senha **nunca** sai do main process. A UI exibe somente o email cadastrado. A senha é utilizada internamente em `sessionManager.ts` (linhas 61-69) para realizar o login via Playwright.

---

## 5. Remoção das credenciais

Em `src/main/secureStorage.ts` (linhas 19-23):

```ts
export async function clearCredentials(): Promise<void> {
  await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_EMAIL);
  await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT_PASSWORD);
  logger.info('Credentials cleared');
}
```

---

## 6. Pontos fortes do design

- **Separação de privilégios**: renderer requisita, main executa. Renderer comprometido não lê a senha.
- **Criptografia OS-grade**: DPAPI / Keychain são padrão da indústria. Não há chave hardcoded no app.
- **Isolation por usuário**: outro usuário Windows na mesma máquina não acessa as credenciais.
- **Padrão IPC consistente** com wrap `Result<T>` evitando vazamento de stack traces para o renderer.

---

## 7. Pontos fracos identificados

- **Email e senha em chaves separadas**: requer 2 round-trips ao keychain. Atomicidade frágil (se o segundo `setPassword` falhar, email fica salvo sem senha). Solução: serializar JSON em uma única entrada.
- **Sem confirmação de write**: `setPassword` resolve antes do fsync do OS. Crash imediato pode perder a credencial recém-salva.
- **Logger emite linha "Credentials saved"** indicando timing exato. Remover ou converter para debug-only.
- **Sem rotação ou expiração**: senha permanece até clear explícito. Mudança de senha upstream Beefor faz o app tentar login com senha antiga, potencialmente lockando a conta.

---

## 8. Reuso da pattern para Coin2U

O módulo Coin2U replica a mesma pattern em `src/main/coin2u/auth.ts` (linhas 269-291). Utiliza o mesmo `KEYTAR_SERVICE` (`beefor-dev`) com accounts distintos:

- `coin2u-email`
- `coin2u-password`

Totalizando **quatro entradas** no keychain do usuário.

---

## 9. Diagrama do fluxo

```
[Renderer React]
      │ window.beefor.saveCredentials({email, password})
      ▼
[Preload contextBridge]
      │ ipcRenderer.invoke('creds:save', creds)
      ▼  (IPC structured clone)
[Main ipcMain.handle]
      │ saveCredentials(creds)
      ▼
[secureStorage.ts]
      │ keytar.setPassword × 2
      ▼  (native binding N-API)
[OS credential store]
      │ DPAPI / Keychain / libsecret encrypt
      ▼
[Disco — blob criptografado, chave do OS]
```

---

## 10. Melhoria sugerida

Trocar as duas entradas separadas por uma única entrada JSON e adicionar rollback caso a operação falhe. Estimativa: ~10 linhas de código.
