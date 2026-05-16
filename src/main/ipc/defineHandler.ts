import { ipcMain } from 'electron';
import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import type { z } from 'zod';
import { fail } from '../../shared/result';
import type { IpcChannel } from '../../shared/ipc/index';
import { logger } from '../logger';
import { validate } from './validate';

type PayloadSelector = (args: unknown[]) => unknown;

interface HandlerContext<TParsed> {
  event: IpcMainInvokeEvent;
  args: unknown[];
  data: TParsed;
}

interface DefineHandlerOptions<TParsed, TResult> {
  channel: IpcChannel;
  schema?: z.ZodType<TParsed>;
  payload?: PayloadSelector;
  errorMessage?: string;
  onError?: (err: unknown) => void;
  run: (ctx: HandlerContext<TParsed>) => Promise<TResult> | TResult;
}

interface EventContext<TParsed> {
  event: IpcMainEvent;
  args: unknown[];
  data: TParsed;
}

interface DefineEventHandlerOptions<TParsed> {
  channel: IpcChannel;
  schema?: z.ZodType<TParsed>;
  payload?: PayloadSelector;
  errorMessage?: string;
  run: (ctx: EventContext<TParsed>) => void;
}

function defaultPayload(args: unknown[]): unknown {
  return args.length <= 1 ? args[0] : args;
}

export function defineHandler<TParsed = undefined, TResult = unknown>({
  channel,
  schema,
  payload = defaultPayload,
  errorMessage = `${channel} failed`,
  onError,
  run,
}: DefineHandlerOptions<TParsed, TResult>): void {
  ipcMain.handle(channel, async (event, ...args) => {
    let data: TParsed = undefined as TParsed;
    if (schema) {
      const parsed = validate(schema, payload(args));
      if (!parsed.ok) return parsed.result;
      data = parsed.data;
    }

    try {
      return await run({ event, args, data });
    } catch (err) {
      try {
        onError?.(err);
      } catch (onErrorErr) {
        logger.error(`${errorMessage} error handler failed`, onErrorErr);
      }
      logger.error(errorMessage, err);
      return fail(err);
    }
  });
}

export function defineEventHandler<TParsed = undefined>({
  channel,
  schema,
  payload = defaultPayload,
  errorMessage = `${channel} failed`,
  run,
}: DefineEventHandlerOptions<TParsed>): void {
  ipcMain.on(channel, (event, ...args) => {
    let data: TParsed = undefined as TParsed;
    if (schema) {
      const parsed = validate(schema, payload(args));
      if (!parsed.ok) return;
      data = parsed.data;
    }

    try {
      run({ event, args, data });
    } catch (err) {
      logger.error(errorMessage, err);
    }
  });
}
