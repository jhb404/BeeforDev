# Endpoints Coin2U

> **Path:** `src/main/coin2u/endpoints.ts`, `src/main/coin2u/auth.ts`, `src/main/coin2u/http.ts`
> **Responsabilidade em uma frase:** Listar cada endpoint Coin2U consumido com metodo, URL, payload e response shape normalizado.

## Responsabilidade
Esta tabela cruza endpoints chamados em auth/endpoints/http. Base padrao: `https://app.coin2u.com.br`.

## API Publica
| Operacao | Metodo | URL | Auth | Request | Response normalizado |
|---|---|---|---|---|---|
| Login | POST | `/Login/Authenticate` | cookies existentes best-effort | `{ Email, Password, IsThereLoginError:false, ErrorMessage:'' }` | `Info.UserId`, `Info.TokenApi`, `Info` completo |
| Dashboard | GET | `/VentronCoins/GetDashboard?userId={id}&token={token}` | cookies + `Authorization:{token}` | query | `Coin2uDashboard` com coins, quotation, members, transactions |
| Log | GET | `/VentronCoins/GetLog?userId={id}&token={token}` | cookies + token | query | `{ Log: Coin2uTransaction[] }` |
| Shop | GET | `/VentronCoins/GetShop?organizationId={org}&userId={id}&token={token}` | cookies + token | query | `{ Coins, ShopItems }` |
| Buy item | GET | `/VentronCoins/BuyItem?shopItemId={id}&from={userId}&price={price}&token=undefined` | cookies + token | query | boolean por texto; HTTP 500 tratado como true |
| Transfer | POST | `/VentronCoins/TransferCoins` | cookies + token | `{ transferCoins: { To, From, Amount, Message } }` | boolean `text === '1' || 'true'` |
| Org list | GET | `/User/GetOrgList?userId={id}` | cookies + token | query | array direto, `data` ou `Orgs`; falha retorna [] |

## Fluxo Interno
Cada endpoint chama `requireUserId` ou `ensureFresh`; dashboard/log/shop parseiam JSON e normalizam com parsers; buy/transfer convertem resposta textual para boolean.

## Erros e Edge Cases
- `requireUserId` usa fallback de settings se auth ainda nao tem userId.
- Shop exige `OrganizationId` vindo de `info` ou fallback settings.
- Buy tem TODO real: sucesso pode retornar HTTP 500; codigo retorna `true` nesse caso.
- `fetchCoin2uOrgs` e best-effort e retorna `[]` em erro.

## Side Effects
Rede Coin2U, possivel relogin via HTTP client, persistencia de login se auth stale.

## Dependencias
- Internas: [auth.md](./auth.md), [http.md](./http.md), [parsers.md](./parsers.md).

## Consumidores
[../02-ipc/handler-coin2u.md](../02-ipc/handler-coin2u.md) e feature renderer Coin2U.

## Testes
Sem teste main; renderer testa formatacao.

## Observacoes / Dividas
> TODO(verify): Documentar contrato bruto completo de responses Coin2U com exemplos reais. O codigo revela normalizacao esperada, mas nao contem fixture/API schema oficial.
