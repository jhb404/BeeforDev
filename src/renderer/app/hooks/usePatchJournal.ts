import { useCallback, useState } from 'react';
import { useIpc } from '../../services/ipc';
import { useJournalBadge } from '../../hooks/useJournalBadge';

export function usePatchJournal() {
  const { settings: settingsClient } = useIpc();
  const { showBadge: journalBadge, markAsSeen: markJournalSeen } = useJournalBadge();
  const [patchModalOpen, setPatchModalOpen] = useState(false);
  const [patchJournal, setPatchJournal] = useState('');
  const [loadingPatchJournal, setLoadingPatchJournal] = useState(false);

  const openPatchJournal = useCallback(async () => {
    setPatchModalOpen(true);
    setLoadingPatchJournal(true);
    markJournalSeen();
    const res = await settingsClient.get();
    setPatchJournal(res.patchJournal?.trim() || 'Nenhuma atualizacao publicada ainda.');
    setLoadingPatchJournal(false);
  }, [markJournalSeen, settingsClient]);

  const closePatchJournal = useCallback(() => setPatchModalOpen(false), []);

  return {
    journalBadge,
    patchModalOpen,
    patchJournal,
    loadingPatchJournal,
    openPatchJournal,
    closePatchJournal,
  };
}
