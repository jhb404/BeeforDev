# Assinatura macOS (Gatekeeper)

> **Path:** `scripts/mac-adhoc-sign.js`, `package.json` campo `build.afterPack` / `build.mac`
> **Responsabilidade em uma frase:** Garantir que o `.app` empacotado tenha assinatura válida, para o macOS não recusar o app como "danificado".

## Diagnóstico

O build usa `mac.identity: null`, logo o electron-builder **não assina** o bundle. Mas ele
modifica o bundle depois de baixar o Electron (renomeia o executável, injeta o `app.asar`,
troca `Info.plist` e ícone). Isso **invalida** a assinatura ad-hoc que o Electron oficial já
traz. O bundle final fica sem assinatura válida.

Em Apple Silicon, código sem assinatura válida não executa. Sintoma:

> “Beefor Dev” está danificado e não pode ser aberto. Mova para o Lixo.

Isso não é quarentena. Por isso `xattr -cr` sozinho não resolve — remover a quarentena não
cria a assinatura que falta. A dupla de comandos que funcionava:

```bash
sudo xattr -r -d com.apple.quarantine "/Applications/Beefor Dev.app"   # tira quarentena
sudo codesign --force --deep --sign - "/Applications/Beefor Dev.app"   # cria assinatura ad-hoc
```

O segundo comando era o que realmente destravava o app.

## Solução aplicada

Hook `afterPack` (`scripts/mac-adhoc-sign.js`), rodando só quando
`electronPlatformName === 'darwin'`:

1. `chmod 755` nos binários auxiliares em `Contents/Resources` (hoje `cloudflared-darwin`) —
   o bit de execução se perde quando o arquivo vem de checkout feito no Windows.
2. `codesign --force --deep --sign -` no bundle → assinatura ad-hoc embutida no `.app`
   **antes** do DMG ser gerado.
3. `codesign --verify --deep --strict` → falha o build se a assinatura não estiver válida.

Pula a assinatura ad-hoc se `CSC_LINK` / `CSC_NAME` / `CSC_KEY_PASSWORD` estiverem no
ambiente (aí o electron-builder assina com certificado real).

Exige host macOS: `codesign` não existe no Windows. O job `build-mac` do
`.github/workflows/release.yml` já roda em `macos-latest`. Em host não-darwin o hook só
emite aviso e segue.

## O que sobra pro usuário final

Uma etapa, sem `sudo` e sem `codesign`:

```bash
xattr -dr com.apple.quarantine "/Applications/Beefor Dev.app"
```

Alternativa sem Terminal: tentar abrir → bloqueio → **Ajustes do Sistema → Privacidade e
Segurança → “Abrir mesmo assim”**. Só na primeira execução.

A quarentena vem do download do DMG e é herdada pelo `.app` copiado dele. Não há como
remover isso do lado do build sem certificado da Apple.

## Zero comandos: Developer ID + notarização

Único caminho para duplo-clique limpo. Custa Apple Developer Program (US$ 99/ano).

1. Criar certificado **Developer ID Application**, exportar `.p12`.
2. Secrets no repositório: `MAC_CSC_LINK` (`.p12` em base64), `MAC_CSC_KEY_PASSWORD`,
   `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`.
3. `build.mac`: remover `identity: null`, `hardenedRuntime: true`, `gatekeeperAssess: false`,
   adicionar `entitlements` + `notarize: { teamId }`.
4. No job `build-mac`, exportar `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`,
   `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`.

Com `hardenedRuntime: true` o app precisa de entitlements para o que hoje roda solto
(spawn do `cloudflared`, Playwright) — `com.apple.security.cs.allow-unsigned-executable-memory`
e `com.apple.security.cs.disable-library-validation` são os candidatos prováveis. Validar
antes de virar a chave.

## Pendências relacionadas ao porte macOS

- **Arquitetura**: `resources/cloudflared-darwin` está commitado no repositório e foi baixado
  de um host Windows, ou seja, é `darwin-amd64`. Em Apple Silicon só roda via Rosetta. O
  `fetch-cloudflared.mjs` pula o download quando o arquivo já existe, então o runner macOS
  nunca baixa a versão arm64. Correção: adicionar `resources/cloudflared-darwin` ao
  `.gitignore`, remover do repositório e deixar o `package:mac` baixar (já incluído no
  script).
- **Build universal**: hoje o `--mac` gera só a arquitetura do runner. A landing anuncia
  “.dmg · Universal”. Ou gerar com `--universal` (requer os dois binários do cloudflared),
  ou corrigir o texto.
- **Auto-update**: `electron-updater` no macOS precisa de target `zip` além do `dmg` e de
  assinatura Developer ID válida — Squirrel.Mac recusa assinatura ad-hoc. Com a config atual
  o auto-update no macOS não funciona.
