# Decisoes Arquiteturais

> **Path:** `DOCS-PROJETO/13-decisoes-arquiteturais/`
> **Responsabilidade em uma frase:** Preservar ADRs historicos do projeto dentro da arvore principal de documentacao.

## Responsabilidade
ADRs registram o motivo das escolhas tecnicas. Eles complementam [../ARQUITETURA.md](../ARQUITETURA.md): arquitetura descreve o estado atual; ADR descreve a decisao e suas consequencias.

## API Publica
| ADR | Tema |
|---|---|
| [0001-feature-sliced-architecture.md](./0001-feature-sliced-architecture.md) | Organizacao feature-sliced do renderer. |
| [0002-path-aliases.md](./0002-path-aliases.md) | Aliases TypeScript. |
| [0003-ipc-typed-clients.md](./0003-ipc-typed-clients.md) | Clients IPC tipados. |
| [0004-api-fast-path.md](./0004-api-fast-path.md) | Caminho rapido API + fallback UI. |
| [0004-api-path-fast-path.md](./0004-api-path-fast-path.md) | Duplicata historica do ADR 0004. |
| [0005-state-management.md](./0005-state-management.md) | Estado local antes de biblioteca de server state. |
| [0006-i18n.md](./0006-i18n.md) | Estrategia i18n. |

## Fluxo Interno
Novas decisoes devem entrar aqui como `NNNN-titulo.md`, mantendo status, contexto, decisao e consequencias.

## Erros e Edge Cases
- Existem dois ADRs `0004-*`; mantidos separados para nao perder historico.
- A consolidacao dessa duplicata esta listada em [../12-debito-tecnico/README.md](../12-debito-tecnico/README.md).

## Side Effects
Nenhum; documentacao historica.

## Dependencias
- Internas: [../ARQUITETURA.md](../ARQUITETURA.md), [../12-debito-tecnico/README.md](../12-debito-tecnico/README.md).

## Consumidores
Engenharia, revisoes de arquitetura e onboarding.

## Testes
Nao aplicavel.

## Observacoes / Dividas
Consolidar os dois ADRs 0004 quando houver decisao sobre qual texto manter.
