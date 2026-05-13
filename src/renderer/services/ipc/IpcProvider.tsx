import { createContext, useContext, type ReactNode } from 'react';
import { sessionClient, type SessionClient } from './session.client';
import { settingsClient, type SettingsClient } from './settings.client';
import { timesheetClient, type TimesheetClient } from './timesheet.client';
import { moodClient, type MoodClient } from './mood.client';
import { kudoClient, type KudoClient } from './kudo.client';
import { teamClient, type TeamClient } from './team.client';
import { coin2uClient, type Coin2uClient } from './coin2u.client';
import { systemClient, windowClient, type SystemClient, type WindowClient } from './system.client';

export interface IpcClients {
  session: SessionClient;
  settings: SettingsClient;
  timesheet: TimesheetClient;
  mood: MoodClient;
  kudo: KudoClient;
  team: TeamClient;
  coin2u: Coin2uClient;
  system: SystemClient;
  window: WindowClient;
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
