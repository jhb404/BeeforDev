import type { IconVariant } from '../../gamification';
import type { PerfilData } from '../hooks/usePerfilData';
import { FunnyLoader } from '../../../components/common/FunnyLoader';
import { ProfileHero } from './ProfileHero';
import { PfxCard } from './PfxCard';
import { MotivadoresBlock } from './MotivadoresBlock';
import { MappingBlock } from './MappingBlock';

interface Props {
  userName?: string;
  xpPct: number;
  level: number;
  xp: number;
  xpNext: number;
  activeIcon: IconVariant;
  data: PerfilData;
  achUnlocked: number;
  achTotal: number;
  onOpenXpInfo: () => void;
  onOpenIcons: () => void;
  onOpenAparencia: () => void;
  onOpenConquistas: () => void;
}

/** Tela inicial do perfil: hero (identidade) + motivadores, ações e mapping. */
export function ProfileHome({
  userName,
  xpPct,
  level,
  xp,
  xpNext,
  activeIcon,
  data,
  achUnlocked,
  achTotal,
  onOpenXpInfo,
  onOpenIcons,
  onOpenAparencia,
  onOpenConquistas,
}: Props) {
  const {
    perfil,
    habilidades,
    habilidadesCombo,
    motivadores,
    acoes,
    mapping,
    loading,
    error,
    addHabilidade,
    removeHabilidade,
    reorderMotivadores,
    addMapping,
    editMapping,
    delMapping,
    saving,
    saveProfile,
    editData,
    gestores,
    loadEditData,
  } = data;

  const nome = perfil?.nome || userName || 'Beta Tester';
  const meta = [
    perfil?.funcaoPrincipal,
    perfil?.ultimoCliente && `Cliente: ${perfil.ultimoCliente}`,
  ]
    .filter(Boolean)
    .join('  |  ');

  return (
    <>
      <ProfileHero
        nome={nome}
        meta={meta}
        funcaoPrincipal={perfil?.funcaoPrincipal}
        foto={perfil?.foto}
        level={level}
        xp={xp}
        xpNext={xpNext}
        xpPct={xpPct}
        activeIcon={activeIcon}
        checkpoints={perfil?.quantidadeVisitas ?? 0}
        acoesCount={acoes.length}
        achUnlocked={achUnlocked}
        achTotal={achTotal}
        miniBio={perfil?.miniBio}
        habilidades={habilidades}
        habilidadesCombo={habilidadesCombo}
        onAddHabilidade={addHabilidade}
        onRemoveHabilidade={removeHabilidade}
        saving={saving}
        onSave={saveProfile}
        editData={editData}
        gestores={gestores}
        onLoadEditData={loadEditData}
        onOpenIcons={onOpenIcons}
        onOpenAparencia={onOpenAparencia}
        onOpenXpInfo={onOpenXpInfo}
        onOpenConquistas={onOpenConquistas}
      />

      <div className="pfx-below">
        {loading && <FunnyLoader title="Carregando perfil" />}
        {error && !loading && <p className="pfx-hint">⚠️ {error}</p>}

        {!loading && (
          <div className="pfx-grid">
            <PfxCard title="⚡ Motivadores" wide>
              <MotivadoresBlock motivadores={motivadores} onReorder={reorderMotivadores} />
            </PfxCard>

            <PfxCard title="🗺️ Personal mapping" wide>
              <MappingBlock
                mapping={mapping}
                onAdd={addMapping}
                onEdit={editMapping}
                onDel={delMapping}
              />
            </PfxCard>
          </div>
        )}
      </div>
    </>
  );
}
