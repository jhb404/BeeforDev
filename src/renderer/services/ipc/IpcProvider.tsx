import { createContext, useContext, type ReactNode } from 'react';
import { sessionClient } from './session.client';
import { settingsClient } from './settings.client';
import { timesheetClient } from './timesheet.client';
import { moodClient } from './mood.client';
import { kudoClient } from './kudo.client';
import { teamClient } from './team.client';
import { coin2uClient } from './coin2u.client';
import { systemClient, windowClient } from './system.client';

export interface IpcClients {
  session: typeof sessionClient;
  settings: typeof settingsClient;
  timesheet: typeof timesheetClient;
  mood: typeof moodClient;
  kudo: typeof kudoClient;
  team: typeof teamClient;
  coin2u: typeof coin2uClient;
  system: typeof systemClient;
  window: typeof windowClient;
}

const defaultClients: IpcClients = {
  session: sessionClient,
  settings: settingsClient,
  timesheet: timesheetClient,
  mood: moodClient,
  kudo: kudoClient,
  team: teamClient,
  coin2u: coin2uClient,
  system: systemClient,
  window: windowClient,
};

const IpcContext = createContext<IpcClients>(defaultClients);

export function IpcProvider({
  clients,
  children,
}: {
  clients?: Partial<IpcClients>;
  children: ReactNode;
}) {
  const merged = clients ? { ...defaultClients, ...clients } : defaultClients;
  return <IpcContext.Provider value={merged}>{children}</IpcContext.Provider>;
}

export function useIpc(): IpcClients {
  return useContext(IpcContext);
}
