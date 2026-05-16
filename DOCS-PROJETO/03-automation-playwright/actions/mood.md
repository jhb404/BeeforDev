# Action Mood

> **Path:** `src/automation/beefor/actions/mood.ts`
> **Responsabilidade em uma frase:** Consultar e selecionar mood diario no Beefor.

## Responsabilidade
A action usa API Beefor `Home/InformaHumor` para leitura rapida quando possivel e DOM do card `app-personal-mood-card` como fallback/para selecao.

## API Publica
| Simbolo | Tipo | Assinatura | Descricao |
|---|---|---|---|
| `doSelectMood` | function | `(page, mood) => Promise<void>` | Garante card visivel, evita clique se ja selecionado, usa seletor primario/fallback. |
| `doGetCurrentMood` | function | `(page) => Promise<string|null>` | Tenta API, depois DOM/classes/atributos. |
| `doGetCurrentMoodViaApi` | function | `(page) => Promise<Mood|null>` | GET `BEEFOR_HOME_API/InformaHumor?idPessoa=...`. |

## Fluxo Interno
```ascii
doGetCurrentMood
  -> doGetCurrentMoodViaApi
  -> ensureMoodVisible
  -> percorre toggles ativos
  -> getMoodFromToggle(svgicon/text/title/aria)
  -> fallback attrs do toggleGroup
```

## Erros e Edge Cases
- Se card nao esta visivel, navega para `BEEFOR_URL` e valida login.
- Se clique primario nao ativa toggle, tenta fallback button selector.
- Retorna `null` quando nenhum toggle ativo e nenhum attr resolve mood.

## Side Effects
Navegacao para dashboard e clique de UI.

## Dependencias
Selectors mood, `beeforApiGet`, `getIdPessoa`, `canonicalMood`, `isLoggedIn`.

## Consumidores
Mood handler, tray action de mood e Home mood flow.

## Testes
Sem teste de action; `useMoodFlow` tem teste no renderer.

## Observacoes / Dividas
Labels com acento dependem do Beefor; mapeamento canonico reduz fragilidade.
