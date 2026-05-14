# 🐝 Beefor Dev

> Desktop app para tarefas no [Beefor](https://app.beefor.io) e ainda integra com [Coin2U](https://app.coin2u.com.br).

<p align="center">
  <img src="build/icon.ico" width="120" alt="Beefor Dev"/>
</p>

<p align="center">
  <a href="https://github.com/jhb404/BeeforDev/releases/latest">
    <img src="https://img.shields.io/github/v/release/jhb404/BeeforDev?style=for-the-badge&color=ff6b35" alt="Última versão"/>
  </a>
  <a href="https://github.com/jhb404/BeeforDev/releases/latest">
    <img src="https://img.shields.io/badge/Download-Windows-blue?style=for-the-badge&logo=windows" alt="Download"/>
  </a>
  <img src="https://img.shields.io/github/downloads/jhb404/BeeforDev/total?style=for-the-badge&color=success" alt="Downloads"/>
</p>

---

## 📥 Baixar agora

**[👉 Clique aqui pra baixar a última versão](https://github.com/jhb404/BeeforDev/releases/latest)**

Procure por `Beefor.Dev.Setup.x.y.z.exe` na seção **Assets** da última release. Clica → instala → abre. Pronto.

Próximas atualizações chegam **automaticamente em background** — você não precisa baixar de novo.

---

## ✨ O que ele faz

### Beefor
- 🔐 **Login automático** — credenciais salvas no Windows Credential Manager (criptografado pelo SO)
- ⏰ **Auto lançamento** de horas no timesheet
- 😄 **Mood do dia** com 1 click
- 🎁 **KudoCards** — enviar e ver histórico de recebidos/enviados
- 👥 **Equipe** — ver time, aniversários, status
- 🔔 **Lembretes** — almoço, mood, kudocard, aniversários
- 📊 **Resumo do mês** — horas trabalhadas, saldo, valor extras, total estimado

### Coin2U
- 💰 **Dashboard** — saldo de coins + cotação em R$
- 🛍️ **Loja** — comprar itens diretamente do app
- 💸 **Transferir coins** pra outros membros
- 📜 **Histórico** de transações e compras

### Geral
- 🌗 **Dark/Light mode**
- 🎨 **Temas customizáveis** (cores, densidade, fontes)
- 🔇 **Sons de UI** opcionais
- 🪟 **Tray icon** — minimiza sem fechar
- 🚀 **Auto-start** no boot do Windows
- 📦 **Auto-update**

---

## 🛠️ Stack

| Camada | Tech |
|--------|------|
| Shell desktop | Electron 31 |
| UI | React 18 + TypeScript + Vite |
| Automação | Playwright (Chromium headless) |
| Storage seguro | keytar (Credential Manager) |
| Logs | electron-log |
| Build/Update | electron-builder + electron-updater |
| Testes | Vitest + React Testing Library |
| i18n | i18next (pt-BR + en) |
| CI/CD | GitHub Actions |

---

## 🤝 Como contribuir / dar feedback

Achou bug? Tem ideia? Algo tá xonxo?

**Discord:** `jbatista404`

Manda direto que respondo. Sugestões são bem-vindas (até as que pedem pra refazer o app inteiro kk).

---

## 🔒 Segurança

- Senhas **nunca** em texto puro — salvas no Windows Credential Manager via `keytar`
- Sessões Playwright isoladas por usuário em `app.getPath('userData')`
- Context Isolation ativo + preload tipado — renderer sem Node access
- MFA/CAPTCHA respeitados — quando aparece, login manual uma vez (sessão salva depois)

---

## 📄 Licença

Uso pessoal/interno. Não distribuir sem permissão.

---

<p align="center">
  Feito com 🐝 + ☕ por <a href="https://github.com/jhb404">João Henrique Batista - JB</a>
</p>
