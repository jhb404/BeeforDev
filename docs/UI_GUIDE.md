# Beefor Dev — UI/UX Style Guide

Padrões a seguir para manter modal/componente novo coerente com o resto do app
(referência: KudoCardHistoryModal, KudoCardModal, TeamModal, Coin2uModal).

---

## Tokens (variáveis CSS)

Sempre usar `var(--token)`, **nunca** cor hardcoded. Definidos em `src/renderer/styles/global.css`.

### Backgrounds (camadas)
| Token | Dark | Light | Uso |
|---|---|---|---|
| `--bg-0` | `#0a0d12` | `#f7f8fb` | App shell |
| `--bg-1` | `#111620` | `#ffffff` | Painel/modal/card primário |
| `--bg-2` | `#181e2a` | `#eef0f5` | Card secundário, input, hover sutil |
| `--bg-3` | `#1e2737` | `#e3e6ee` | Hover sobre `--bg-2`, toggle pressed |

### Acento (roxo) — ações, foco, seleção
| Token | Dark | Light |
|---|---|---|
| `--accent` | `#7c5cbf` | `#6d4ac9` |
| `--accent-hover` | `#6a4daa` | `#5836b0` |
| `--accent-soft` | `rgba(124,92,191,.14)` | `rgba(109,74,201,.12)` |
| `--focus-ring` | `rgba(124,92,191,.25)` | `rgba(109,74,201,.28)` |

### Warm (laranja) — destaques especiais, tab ativa, "Mario coin"
| Token | Dark | Light |
|---|---|---|
| `--warm` / `--accent-2` | `#ff9400` | `#d9730d` |
| `--warm-hover` | `#e07f00` | `#b65f08` |
| `--accent-2-soft` | `rgba(255,148,0,.12)` | `rgba(217,115,13,.12)` |

### Texto
| Token | Uso |
|---|---|
| `--text` | Texto primário |
| `--text-muted` | Labels, metadados, descrições |
| `--button-text` | Texto sobre fundo `--accent` ou `--warm` (sempre `#fff`) |

### Estado
| Token | Uso |
|---|---|
| `--ok` / `--ok-border` | Sucesso |
| `--warn` | Aviso amarelo |
| `--err` / `--err-border` | Erro vermelho |

### Borda + radius + sombra
| Token | Uso |
|---|---|
| `--border` | Separador padrão |
| `--border-strong` | Divisor mais marcado, contorno modal |
| `--radius` | `10px` — radius padrão de inputs/botões/cards/tabs |
| `--shadow` | Sombra modal/popover |

---

## Modal padrão

Estrutura HTML:

```tsx
<div className="modal-backdrop" role="presentation">
  <section className="modal-card xxx-modal" role="dialog" aria-modal="true" aria-labelledby="...">
    <div className="modal-head">
      <div>
        <p className="eyebrow">Categoria</p>
        <h2 id="...">Título</h2>
        <p className="xxx-subtitle">Subtítulo opcional</p>
      </div>
      <div className="xxx-head-actions">
        <button className="secondary compact">Atualizar</button>
        <button className="secondary compact" data-sound="close">Fechar</button>
      </div>
    </div>

    <div className="xxx-toolbar">{/* search + tabs */}</div>
    <div className="xxx-body">{/* conteúdo principal */}</div>
  </section>
</div>
```

Especificações:

| Elemento | Padding | Borda | Radius |
|---|---|---|---|
| `.modal-backdrop` | `22px` | — | — |
| `.modal-card` | — | `1px var(--border-strong)` | `16px` |
| `.modal-head` | `16px 18px 12px` | `border-bottom 1px var(--border)` | — |
| Toolbar (search/tabs) | `14px 18px 14px` | — | — |
| Body | `0 18px 18px` | — | — |

Lateral consistente: **18px** em todo o conteúdo do modal. Modal inteiro usa `--panel-bg`, `--shadow`.

### Modal com conteúdo dinâmico / cache

Quando uma modal lista dados vindos de API/cache (ex.: Coin2U, time, histórico), manter dimensão estável para a UI não "pular" quando busca/filtro reduz o resultado:

```css
.xxx-modal {
  height: 720px;
  max-height: calc(100vh - 44px);
  display: flex;
  flex-direction: column;
}
.xxx-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
```

Regra: cache pode renderizar instantâneo, mas a área da modal não deve encolher quando vem 1 item, erro, loading parcial ou filtro vazio.

---

## Botões

Definidos no global.css. Sempre usar essas variantes, **não criar** `primary`/`ghost`.

```tsx
<button>Default</button>                           {/* roxo --accent, branco */}
<button className="secondary">Secundário</button>  {/* --bg-2, texto --text */}
<button className="secondary compact">…</button>   {/* mais baixo (30px) */}
<button className="warm">Warm</button>             {/* laranja */}
<button className="danger">Apagar</button>         {/* vermelho */}
<button disabled>…</button>                        {/* opacity .4 */}
```

Min-height: `36px` padrão, `30px` se `.compact`.

### Botão de ação em painel lateral

Em drawer/painel lateral de formulário (ex.: `Enviar coins`, `Lançar Dia`), a ação principal fica alinhada à direita e não ocupa a linha toda:

```css
.xxx-panel .warm,
.xxx-panel button:not(.secondary) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-end;
  width: auto;
}
```

---

## Tabs / Filtros (estilo segmented)

**Padrão obrigatório** (KudoCardHistory + TeamModal). NÃO usar pills arredondadas com 999px.

```tsx
<div className="xxx-tabs">
  <button className={tab === 'a' ? 'active' : ''}>A</button>
  <button className={tab === 'b' ? 'active' : ''}>B</button>
</div>
```

```css
.xxx-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);          /* 10px, NÃO 999px */
  padding: 4px;
  width: fit-content;
}
.xxx-tabs button {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 7px 14px;
  border-radius: calc(var(--radius) - 2px);
  font-size: 13px;
  font-weight: 500;
  min-height: unset;
  cursor: pointer;
  transition: background .12s, color .12s;
}
.xxx-tabs button:hover:not(.active) {
  background: var(--bg-3);
  color: var(--text);
}
.xxx-tabs button.active {
  background: var(--warm);               /* laranja */
  color: var(--button-text);             /* branco */
}
```

---

## Inputs (search + texto)

Bordas **`--radius` (10px)**, NÃO 999px. Pílula só pra badges/tags.

```css
.xxx-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-muted);
  transition: border-color .18s, background .18s;
}
.xxx-search:focus-within {
  border-color: var(--accent);
  background: var(--bg-1);
}
.xxx-search input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  color: var(--text);
  font-size: 13px;
  min-height: unset;
  padding: 0;
  box-shadow: none;
}
.xxx-search input:focus {
  border-color: transparent;
  box-shadow: none;
}
```

Inputs nativos seguem regra global em `global.css` (radius 8px + foco roxo + ring).
Em inputs dentro de wrapper visual (`.xxx-search`, autocomplete tipo KudoCard/Coin2U), o foco roxo deve ficar **só no wrapper**, não no input interno.

---

## Cards (lista/grid)

```css
.xxx-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: 14px;                   /* leve maior que --radius p/ cards grandes */
  transition: transform .18s, border-color .18s, background .18s, box-shadow .18s;
  cursor: pointer;
}
.xxx-card:hover {
  transform: translateY(-1px);
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;                           /* texto branco no hover */
}
.xxx-card:hover .xxx-card__muted {
  color: rgba(255,255,255,.8);
}
.xxx-card--active {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent-soft) inset;
  background: var(--bg-2);
}
```

Regra: hover de card **roxo cheio** → todo texto vira branco. Tags/badges que ficariam invisíveis no hover trocam para `--warm`.

### Cards em grid/lista filtrável

Quando lista/grid fica dentro de uma área fixa e pode retornar poucos itens (ex.: busca de pessoa no Coin2U), cards não podem esticar para preencher altura livre. Use `align-content: start`, `align-items: start` e linhas `min-content`.

```css
.xxx-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  grid-auto-rows: min-content;
  align-content: start;
  align-items: start;
  gap: 8px;
  padding: 8px;
  flex: 1;
  overflow-y: auto;
}
.xxx-list-card {
  min-height: 58px;
  height: auto;
  padding: 10px 12px;
  border-radius: var(--radius);          /* card pequeno/lista: mais quadrado */
}
```

Use `border-radius: 14px` só para cards grandes como TeamCard. Para cards compactos/listagem estilo Kudo history/Coin2U, prefira `var(--radius)`.

### Paginação local

Se API retorna lista grande de uma vez e filtro é client-side, prefira paginação local simples antes de virtualização. Ex.: Coin2U usa 48 pessoas por página.

```css
.xxx-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.xxx-pagination span {
  color: var(--text-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
```

Regra: paginar para reduzir DOM/CPU/RAM quando a lista é grande; virtualizar só se paginação prejudicar workflow.

---

## Badges / pills / tags

Pílulas (`border-radius: 999px`) somente aqui.

```css
.xxx-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
}
.xxx-badge--warm  { background: var(--accent-2-soft); color: var(--warm);  }
.xxx-badge--ok    { background: rgba(39,184,153,.12); color: var(--ok);    }
.xxx-badge--err   { background: rgba(224,84,112,.12); color: var(--err);   }
```

Status com bolinha animada: ver `.team-status` (TeamStatusBadge).

---

## Avatares

Círculo, 2px borda, fallback iniciais coloridas com `--accent`. Ver `TeamAvatar`.

---

## Drawer lateral (detalhes)

Quando precisa abrir painel de detalhes ao lado da lista:

```css
.xxx-drawer {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: auto;
}
```

Grid pai: `grid-template-columns: minmax(0, 1fr) minmax(280px, 360px)`.

---

## Sons (`data-sound`)

Ver `src/renderer/utils/alarm.ts`. Tipos válidos:

`click | close | tab-home | tab-settings | calendar-pick | mood-select |
auto-lancar-start | auto-lancar-success | kudo-open | kudo-sent | theme-toggle |
journal | lancar-dia | notify | coin | success | team-open | team-refresh`

Regras:
- Botão fechar: `data-sound="close"`
- Botão genérico: `data-sound="click"`
- Pick em lista/card: `data-sound="calendar-pick"`
- Tab/filter switch: `data-sound="tab-home"` (ou `tab-settings` para inverter direção)
- Sucesso (lançamento, save): `data-sound="success"`
- Não inventar `data-sound="generic-click"`, etc — adicionar em `alarm.ts` antes.

---

## Acessibilidade

- Todo modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` apontando para `<h2>`.
- Botão de ícone: sempre `aria-label`.
- Tabs/filtros: `role="tablist"` + `role="tab"` + `aria-selected`.
- Inputs com label visual usar `<label>` envolvendo input (ver TeamBirthdayEditor).

---

## Animação

- Transições padrão: `0.12s` (interação rápida) ou `0.18s` (hover de card).
- Easing: `ease` (default).
- Trocar tema: usar classe `theme-anim` em `<html>` (já implementado em App.tsx).
- Evitar animações > 0.3s em hover, abrir modal pode ter fade.

---

## Densidade

App suporta `data-density="compact|normal|comfortable"` (no `<html>`). Componentes
novos devem reutilizar tokens — não hardcodar paddings em px fora dos previstos.

---

## Checklist antes de mergear UI nova

- [ ] Cores via `var(--token)`, zero hex hardcoded
- [ ] Modal segue `modal-backdrop` + `modal-card` + `modal-head`, padding lateral 18px
- [ ] Tabs/filtros usam `--radius` (não 999px) e `--warm` no active
- [ ] Inputs usam `--radius` (10px) — pílula só em badges
- [ ] Input dentro de wrapper visual não tem foco duplo; foco fica no wrapper
- [ ] Hover de card → `--accent` cheio, texto branco, badge laranja
- [ ] Cards de lista fixa não esticam quando filtro retorna poucos itens
- [ ] Listas grandes vindas prontas da API usam paginação local antes de virtualização
- [ ] Botão usa `secondary` / `compact` / `warm` / `danger` — não inventar classe
- [ ] Ação principal em painel lateral fica à direita e com largura do conteúdo
- [ ] `data-sound` mapeado em `alarm.ts`
- [ ] Light + dark testados (alternar com `/` no app)
- [ ] Acessibilidade: `aria-label`, `role`, `aria-selected`
