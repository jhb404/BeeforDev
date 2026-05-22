import { beeforHttp, getValidSession } from './beeforHttpClient';

export interface NotificacaoItem {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  dataCriacao: string;
  tipo?: string;
  link?: string;
}

function mapNotif(raw: any): NotificacaoItem {
  return {
    id: String(raw?.id ?? raw?.idNotificacao ?? '').trim(),
    titulo: String(raw?.titulo ?? raw?.title ?? ''),
    mensagem: String(raw?.mensagem ?? raw?.descricao ?? raw?.texto ?? ''),
    lida: Boolean(raw?.lida ?? raw?.lido ?? false),
    dataCriacao: String(raw?.dataCriacao ?? raw?.data ?? ''),
    tipo: typeof raw?.tipo === 'string' ? raw.tipo : undefined,
    link: typeof raw?.link === 'string' ? raw.link : undefined,
  };
}

export async function listNotificacoesNaoLidas(idPessoa?: string): Promise<NotificacaoItem[]> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const data = await beeforHttp.get<any[]>(`/Notificacao/NaoLidas/${encodeURIComponent(target)}`);
  return Array.isArray(data) ? data.map(mapNotif) : [];
}

export async function listAllNotificacoes(idPessoa?: string): Promise<NotificacaoItem[]> {
  const session = await getValidSession();
  const target = idPessoa ?? session.idPessoa;
  const data = await beeforHttp.get<any[]>(`/Notificacao/Todas/${encodeURIComponent(target)}`);
  return Array.isArray(data) ? data.map(mapNotif) : [];
}

export async function marcarComoLida(idNotificacao: string): Promise<unknown> {
  return beeforHttp.get(`/Notificacao/LerNotificacao/${encodeURIComponent(idNotificacao)}`);
}

export async function marcarTodasComoLidas(idUser?: string): Promise<unknown> {
  const session = await getValidSession();
  const target = idUser ?? session.idPessoa;
  return beeforHttp.get(`/Notificacao/LerTodasNotificacoes/${encodeURIComponent(target)}`);
}

export async function listNovidadesGoobee(): Promise<NotificacaoItem[]> {
  const data = await beeforHttp.get<any[]>('/Notificacao/novidadesGoobee');
  return Array.isArray(data) ? data.map(mapNotif) : [];
}

export async function listNovidadesUsuario(): Promise<NotificacaoItem[]> {
  const data = await beeforHttp.get<any[]>('/Notificacao/novidadesGoobee/usuario');
  return Array.isArray(data) ? data.map(mapNotif) : [];
}

export async function totalNovidadesNaoLidas(): Promise<number> {
  const data = await beeforHttp.get<any>('/Notificacao/novidadesGoobee/total/false');
  if (typeof data === 'number') return data;
  if (data && typeof data === 'object' && 'total' in data) return Number((data as any).total) || 0;
  return Number(data) || 0;
}

export async function marcarNovidadeLida(idNotificacao: string): Promise<unknown> {
  return beeforHttp.get(
    `/Notificacao/novidadesGoobee/lida/${encodeURIComponent(idNotificacao)}`,
  );
}

export async function marcarTodasNovidadesLidas(): Promise<unknown> {
  return beeforHttp.get('/Notificacao/novidadesGoobee/lida/tudo');
}
