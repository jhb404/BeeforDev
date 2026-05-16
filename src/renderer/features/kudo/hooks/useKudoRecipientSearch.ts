import { useEffect, useRef, useState } from 'react';
import type { KudoCardRecipientType, KudoSearchResult } from '@shared/types/index';
import { kudoClient } from '../../../services/ipc';
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
  const [recipientName, setRecipientName] = useState('');
  const [suggestions, setSuggestions] = useState<KudoSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestErr, setSuggestErr] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seqRef = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const reset = () => {
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
  }, [recipientName, recipientType, open]);

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
    setRecipientName(s.name);
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
