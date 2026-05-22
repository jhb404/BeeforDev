/**
 * SignalR hub client p/ /hubs/notificacoes (goobeeteams).
 *
 * NOTA: requer instalar `@microsoft/signalr` no projeto:
 *   npm install @microsoft/signalr
 *
 * Sem o pacote instalado, este módulo expõe uma versão NO-OP que loga e retorna.
 * Após instalar, troque o `loadHub()` para `await import('@microsoft/signalr')`.
 */

import { EventEmitter } from 'node:events';
import { getBeeforApiBase } from '../../shared/constants';
import { getCachedSession } from './beeforHttpClient';
import { logger } from '../logger';

export type BeeforHubEvent =
  | 'mood:changed'
  | 'kudo:received'
  | 'kudo:sent'
  | 'card:moved'
  | 'card:created'
  | 'notif:new';

interface HubMessage {
  type: BeeforHubEvent;
  payload: unknown;
}

const emitter = new EventEmitter();

let connection: any = null;
let lib: any = null;

async function loadHub(): Promise<any> {
  if (lib) return lib;
  try {
    // dynamic import — falha se pacote não instalado
    // @ts-ignore
    lib = await import('@microsoft/signalr');
    return lib;
  } catch {
    logger.warn(
      'SignalR: pacote @microsoft/signalr não instalado. Real-time push desativado. Rode: npm install @microsoft/signalr',
    );
    return null;
  }
}

function hubBaseUrl(): string {
  // /hubs/notificacoes lives no host raiz, NÃO sob /api
  const apiBase = getBeeforApiBase();
  return apiBase.replace(/\/api\/?$/, '');
}

export function onHubEvent<T = unknown>(
  event: BeeforHubEvent,
  handler: (payload: T) => void,
): () => void {
  emitter.on(event, handler as (p: unknown) => void);
  return () => emitter.off(event, handler as (p: unknown) => void);
}

export async function connectHub(): Promise<boolean> {
  if (connection) return true;
  const signalr = await loadHub();
  if (!signalr) return false;

  const session = getCachedSession();
  if (!session?.token) {
    logger.warn('SignalR: sessão sem token — abortando conexão.');
    return false;
  }

  const url = `${hubBaseUrl()}/hubs/notificacoes`;
  connection = new signalr.HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: () => getCachedSession()?.token ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(signalr.LogLevel.Warning)
    .build();

  // Server method names podem variar — registramos múltiplos potenciais:
  const bind = (method: string, type: BeeforHubEvent) => {
    connection.on(method, (payload: unknown) => {
      logger.info(`Hub event ${method} → ${type}`);
      const msg: HubMessage = { type, payload };
      emitter.emit(type, payload);
      emitter.emit('any', msg);
    });
  };
  bind('MoodChanged', 'mood:changed');
  bind('SentimentoAtualizado', 'mood:changed');
  bind('KudoCardRecebido', 'kudo:received');
  bind('KudoReceived', 'kudo:received');
  bind('KudoCardEnviado', 'kudo:sent');
  bind('CardMovido', 'card:moved');
  bind('CardCriado', 'card:created');
  bind('NotificacaoNova', 'notif:new');

  try {
    await connection.start();
    logger.info(`SignalR conectado em ${url}`);
    return true;
  } catch (err) {
    logger.warn(`SignalR connect falhou: ${err instanceof Error ? err.message : String(err)}`);
    connection = null;
    return false;
  }
}

export async function disconnectHub(): Promise<void> {
  if (!connection) return;
  try {
    await connection.stop();
    logger.info('SignalR desconectado');
  } catch (err) {
    logger.warn(`SignalR stop falhou: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    connection = null;
  }
}

export function isHubConnected(): boolean {
  return Boolean(connection && connection.state === 'Connected');
}
