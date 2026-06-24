import { useEffect, useState } from 'react';
import { useSelectedTeamId } from '../../../app/contextSelection';
import { usePraticasConfig } from '../hooks/usePraticasData';
import { CARD_REGISTRY, CHIP_CHAVES, FIXOS } from './cards/registry';
import { PraticaChip, CHIPS } from './PraticaChip';
import { ConfigModal } from './ConfigModal';

/**
 * Home de Práticas Ágeis — config-driven (espelha goobeeteams praticas-ageis).
 * Faixa de chips no topo (Capacity/Niko/Indicador → click abre modal config);
 * Termômetro + Assessment fixos; demais cards vêm da config do time, via registry.
 */
export function PraticasDashboard() {
  const globalTeamId = useSelectedTeamId();
  const [fallbackId, setFallbackId] = useState<string | null>(null);
  const idTime = globalTeamId ?? fallbackId;
  const { config, loading, error } = usePraticasConfig(idTime);
  const [modal, setModal] = useState<{ titulo: string; valor: string } | null>(null);

  useEffect(() => {
    if (globalTeamId || fallbackId) return;
    let alive = true;
    void window.beeforHttp.team.list().then((res) => {
      if (!alive || !res.ok) return;
      const fav = res.data.find((t) => t.favorito) ?? res.data[0];
      if (fav) setFallbackId(fav.id);
    });
    return () => {
      alive = false;
    };
  }, [globalTeamId, fallbackId]);

  if (!idTime) {
    return (
      <section className="praticas-dashboard">
        <div className="praticas-loading">Selecione um time no topo para ver as práticas.</div>
      </section>
    );
  }

  const ativas = new Set(config.map((p) => p.chave));
  const chavesFixas = new Set(FIXOS.map((f) => f.chave));
  // chips só p/ práticas realmente ativas no time
  const chipsAtivos = CHIPS.filter((c) => ativas.has(c.chave));
  // cards: na config, com componente, fora dos fixos e dos chips
  const cardsConfig = config.filter(
    (p) => CARD_REGISTRY[p.chave] && !chavesFixas.has(p.chave) && !CHIP_CHAVES.has(p.chave),
  );

  return (
    <section className="praticas-dashboard">
      <header className="praticas-dashboard-head">
        <h2>Práticas de Gestão</h2>
      </header>

      {error && <div className="praticas-error">Falha ao carregar config: {error}</div>}

      {/* faixa de chips compactos */}
      {chipsAtivos.length > 0 && (
        <div className="praticas-chips">
          {chipsAtivos.map((def) => (
            <PraticaChip
              key={def.chave}
              def={def}
              idTime={idTime}
              onOpen={(titulo, valor) => setModal({ titulo, valor })}
            />
          ))}
        </div>
      )}

      <div className="praticas-grid">
        {FIXOS.map((f) => {
          const Card = CARD_REGISTRY[f.chave];
          return <Card key={f.chave} chave={f.chave} idTime={idTime} nome={f.nome} />;
        })}
        {cardsConfig.map((p) => {
          const Card = CARD_REGISTRY[p.chave];
          return (
            <Card
              key={p.idPraticaAgil || p.chave}
              chave={p.chave}
              idTime={idTime}
              nome={p.nomePraticaAgil}
            />
          );
        })}
      </div>

      {loading && <div className="praticas-loading">Carregando práticas…</div>}
      {!loading && cardsConfig.length === 0 && chipsAtivos.length === 0 && (
        <div className="praticas-loading">Nenhuma prática configurada neste time.</div>
      )}

      {modal && (
        <ConfigModal titulo={modal.titulo} valor={modal.valor} onClose={() => setModal(null)} />
      )}
    </section>
  );
}
