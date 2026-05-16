import { useEffect, useRef, useState } from 'react';
import type { KudoCardRecipientType, KudoSearchResult } from '@shared/types/index';
import { useIpc } from '../../../services/ipc';
import { getError } from '@shared/result';

interface UseKudoRecipientSearchResult {
  recipientName: string;
  setRecipientName: (v: string) => void;
  suggestions: KudoSearchResult[];
  searching: boolean;
  suggestOpen: boolean;
  setSuggestOpen: (v: boolean) => void;
  suggestErr: string | null;
  wrapRef: React.RefObject<HTMLDivElement>;
  pickSuggestion: (s: KudoSearchResult) => void;
  reset: () => void;
}

export function useKudoRecipientSearch(
  recipientType: KudoCardRecipientType,
  open: boolean,
): UseKudoRecipientSearchResult {
  const { kudo: kudoClient } = useIpc();
  const [recipientName, setRecipientName] = useState('');
  const [suggestions, setSuggestions] = useState<KudoSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestErr, setSuggestErr] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);
  const pickedRef = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    pickedRef.current = false;
    setRecipientName('');
    setSuggestions([]);
    setSuggestOpen(false);
    setSuggestErr(null);
  };

  useEffect(() => {
    setSuggestions([]);
    setSuggestOpen(false);
    setSuggestErr(null);
  }, [recipientType]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (pickedRef.current) {
      pickedRef.current = false;
      return;
    }
    const q = recipientName.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setSuggestOpen(false);
      return;
    }
    const mySeq = ++seqRef.current;
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await kudoClient.searchRecipient(recipientType, q);
        if (mySeq !== seqRef.current) return;
        if (res.ok && res.data) {
          setSuggestions(res.data);
          setSuggestOpen(true);
          setSuggestErr(res.data.length === 0 ? 'Nenhum resultado.' : null);
        } else {
          setSuggestions([]);
          setSuggestOpen(true);
          setSuggestErr(getError(res) || 'Falha ao buscar.');
        }
      } finally {
        if (mySeq === seqRef.current) setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [recipientName, recipientType, open, kudoClient]);

  useEffect(() => {
    if (!suggestOpen) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [suggestOpen]);

  const pickSuggestion = (s: KudoSearchResult) => {
    pickedRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    seqRef.current++;
    setSearching(false);
    setRecipientName(s.name);
    setSuggestions([]);
    setSuggestErr(null);
    setSuggestOpen(false);
  };

  return {
    recipientName,
    setRecipientName,
    suggestions,
    searching,
    suggestOpen,
    setSuggestOpen,
    suggestErr,
    wrapRef,
    pickSuggestion,
    reset,
  };
}
