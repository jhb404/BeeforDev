import { useState } from 'react';
import type { KudoCardType, SendKudoCardRequest } from '@shared/types';
import { KUDO_CARD_TYPES } from '@shared/types';
import { kudoClient } from '../../../services/ipc';

interface UseKudoCardSendOptions {
  onSent: (msg: string) => void;
  onError: (msg: string) => void;
  onClose: () => void;
}

interface UseKudoCardSendResult {
  cardType: KudoCardType;
  setCardType: (t: KudoCardType) => void;
  message: string;
  setMessage: (v: string) => void;
  submitting: boolean;
  errMsg: string | null;
  handleSubmit: (recipientType: string, recipientName: string) => Promise<void>;
  reset: () => void;
}

export function useKudoCardSend({
  onSent,
  onError,
  onClose,
}: UseKudoCardSendOptions): UseKudoCardSendResult {
  const [cardType, setCardType] = useState<KudoCardType>(KUDO_CARD_TYPES[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const reset = () => {
    setCardType(KUDO_CARD_TYPES[0]);
    setMessage('');
    setErrMsg(null);
  };

  const handleSubmit = async (recipientType: string, recipientName: string) => {
    if (!recipientName.trim()) {
      setErrMsg('Informe o destinatário.');
      return;
    }
    if (!message.trim()) {
      setErrMsg('Escreva uma mensagem.');
      return;
    }
    setErrMsg(null);
    setSubmitting(true);
    const payload: SendKudoCardRequest = {
      recipientType: recipientType as SendKudoCardRequest['recipientType'],
      recipientName: recipientName.trim(),
      message: message.trim(),
      cardType,
    };
    try {
      const res = await kudoClient.send(payload);
      if (res.ok) {
        onSent(res.data?.message ?? 'KudoCard enviado.');
        onClose();
      } else {
        const msg = res.error ?? 'Falha ao enviar KudoCard.';
        setErrMsg(msg);
        onError(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado.';
      setErrMsg(msg);
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    cardType,
    setCardType,
    message,
    setMessage,
    submitting,
    errMsg,
    handleSubmit,
    reset,
  };
}
