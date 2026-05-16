import { z } from 'zod';

const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'invalid time HH:MM');
const optionalTimeStr = z.union([
  z.literal(''),
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'invalid time HH:MM'),
]);

export const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

export const coin2uCredentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

export const moodSchema = z.enum(['Dia feliz', 'Dia bom', 'Dia não tão bom', 'Dia triste']);

export const timesheetEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid date'),
  entrada: optionalTimeStr,
  int1: optionalTimeStr,
  ret1: optionalTimeStr,
  int2: optionalTimeStr,
  ret2: optionalTimeStr,
  saida: optionalTimeStr,
  comentario: z.string().max(500).optional(),
});

export const fetchTimesheetArgsSchema = z.tuple([
  z.number().int().min(2000).max(2100),
  z.number().int().min(1).max(12),
]);

export const kudoRecipientTypeSchema = z.enum(['person', 'team']);

export const kudoSearchArgsSchema = z.tuple([kudoRecipientTypeSchema, z.string().min(1).max(120)]);

export const sendKudoCardSchema = z.object({
  recipientType: kudoRecipientTypeSchema,
  recipientName: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  cardType: z.enum([
    'Forca_Prancheta_1',
    'Mestre_Prancheta_1',
    'Maravilha_Prancheta_1',
    'Incrivel_Prancheta_1',
    'Imbativel_Prancheta_1',
    'Super_Prancheta_1',
    'Time_Prancheta_1',
    'Parabens_Prancheta_1',
  ]),
});

export const kudoDetailIdSchema = z.string().min(1).max(64);

export const coin2uTransferSchema = z.object({
  To: z.number().int().positive(),
  Amount: z.number().int().positive().max(1_000_000),
  Message: z.string().max(500).default(''),
});

export const coin2uBuyItemSchema = z.object({
  shopItemId: z.number().int().positive(),
  price: z.number().int().positive().max(10_000_000),
});

export const notifyTestKindSchema = z.enum(['mood', 'lunch', 'kudocard', 'punch']);

export const notifyWindowsArgsSchema = z.tuple([
  z.string().max(200),
  z.string().max(2000),
  z.enum(['orange', 'purple']).optional(),
]);

export const assetFileNameSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[A-Za-z0-9._-]+$/, 'invalid file name');

export const settingsSchema = z
  .object({
    autoStart: z.boolean(),
    autoLoginOnLaunch: z.boolean(),
    automatePunch: z.boolean(),
    punchTimes: z.array(timeStr).max(8),
    punchDriftMinutes: z.number().int().min(0).max(120),
    lunchAlarm: z.boolean(),
    lunchAlarmTime: timeStr,
    moodNotification: z.boolean(),
    moodNotificationTime: timeStr,
    moodAlarm: z.boolean(),
    kudocardNotification: z.boolean(),
    kudocardFrequency: z.enum(['once', 'twice', 'custom']),
    kudocardDays: z.array(z.number().int().min(1).max(31)).max(31),
    hoursPerDay: z.number().min(0).max(24),
    hourRate: z.number().min(0).max(10_000),
    uiSounds: z.boolean(),
  })
  .passthrough(); // tolerate forward-compatible extra fields (e.g., logoVariant, patchJournal)
