import { useEffect, useState } from 'react';
import type {
  KudoCardCounts,
  KudoCardDetail,
  KudoCardListItem,
  KudoCardLists,
} from '@shared/types';
import { kudoClient } from '../../../services/ipc';

interface UseKudoHistoryResult {
  counts: KudoCardCounts | null;
  lists: KudoCardLists | null;
  loading: boolean;
  errMsg: string | null;
  selected: KudoCardListItem | null;
  setSelected: (item: KudoCardListItem | null) => void;
  detail: KudoCardDetail | null;
  loadingDetail: boolean;
}

export function useKudoHistory(open: boolean): UseKudoHistoryResult {
  const [counts, setCounts] = useState<KudoCardCounts | null>(null);
  const [lists, setLists] = useState<KudoCardLists | null>(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<KudoCardListItem | null>(null);
  const [detail, setDetail] = useState<KudoCardDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setDetail(null);
      setErrMsg(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErrMsg(null);
    void (async () => {
      const [cRes, lRes] = await Promise.all([
        kudoClient.getCounts(),
        kudoClient.getLists(),
      ]);
      if (cancelled) return;
      if (cRes.ok && cRes.data) setCounts(cRes.data);
      if (lRes.ok && lRes.data) setLists(lRes.data);
      if (!cRes.ok || !lRes.ok) {
        setErrMsg(cRes.error ?? lRes.error ?? 'Falha ao carregar.');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!selected) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    void (async () => {
      const res = await kudoClient.getDetail(selected.id);
      if (cancelled) return;
      if (res.ok && res.data) setDetail(res.data);
      else setDetail(null);
      setLoadingDetail(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  return {
    counts,
    lists,
    loading,
    errMsg,
    selected,
    setSelected,
    detail,
    loadingDetail,
  };
}
