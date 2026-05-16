import type { AppSettings } from '@shared/types/index';

export interface AppearanceCardProps {
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => void;
}

export interface ViewModeCardProps extends AppearanceCardProps {
  onChangeViewMode: (mode: 'classic' | 'minimal') => void;
}
