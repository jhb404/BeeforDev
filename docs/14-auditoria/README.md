# Auditoria

> **Path:** `DOCS-PROJETO/14-auditoria/`
> **Responsabilidade em uma frase:** Guardar artefatos de auditoria tecnica e seguranca junto da documentacao do projeto.

## Responsabilidade
Esta pasta guarda relatorios gerados por ferramentas. O relatorio atual vem do Electronegativity e complementa [../SEGURANCA.md](../SEGURANCA.md).

## API Publica
| Arquivo | Conteudo |
|---|---|
| [electronegativity-report.csv](./electronegativity-report.csv) | Resultado CSV do scan Electronegativity. |

## Fluxo Interno
Para atualizar o relatorio, rode o scanner e substitua o CSV nesta pasta. A interpretacao das findings fica em [../SEGURANCA.md](../SEGURANCA.md).

## Erros e Edge Cases
- O CSV contem paths absolutos da maquina em que o scanner foi executado.
- Algumas findings do CSV podem estar desatualizadas em relacao ao codigo atual; validar contra [../01-main-process/window.md](../01-main-process/window.md) e [../01-main-process/secure-storage.md](../01-main-process/secure-storage.md).

## Side Effects
Nenhum; artefato estatico.

## Dependencias
- Externas: Electronegativity.

## Consumidores
Revisoes de seguranca e auditorias futuras.

## Testes
Nao aplicavel.

## Observacoes / Dividas
Gerar novo CSV depois de qualquer alteracao em CSP, `BrowserWindow`, preload ou `openExternal`.
