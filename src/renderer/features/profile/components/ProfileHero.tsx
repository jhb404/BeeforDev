import { useEffect, useRef, useState } from 'react';
import { BeeforLogo } from '../../../components/common/BeeforLogo';
import type { IconVariant } from '../../gamification';
import type { GestorItem, PerfilData, ProfilePatch } from '../hooks/usePerfilData';
import { fileToDataUri, MAX_IMAGE_BYTES } from '../utils/fileToDataUri';
import { XPBar } from './XPBar';
import { SocialLinks } from './SocialLinks';
import { StatsCard } from './StatsCard';
import { BioCard } from './BioCard';
import { PfxCard } from './PfxCard';
import { HabilidadesBlock } from './HabilidadesBlock';

const IDIOMAS: Array<{ value: number; label: string }> = [
  { value: 1, label: '🇧🇷 Português' },
  { value: 2, label: '🇺🇸 English' },
  { value: 3, label: '🇪🇸 Español' },
];

interface Props {
  nome: string;
  meta: string;
  funcaoPrincipal?: string;
  foto?: string;
  level: number;
  xp: number;
  xpNext: number;
  xpPct: number;
  activeIcon: IconVariant;
  checkpoints: number;
  acoesCount: number;
  achUnlocked: number;
  achTotal: number;
  miniBio?: string;
  habilidades: PerfilData['habilidades'];
  habilidadesCombo: PerfilData['habilidadesCombo'];
  onAddHabilidade: PerfilData['addHabilidade'];
  onRemoveHabilidade: PerfilData['removeHabilidade'];
  saving: boolean;
  onSave: (patch: ProfilePatch) => Promise<boolean>;
  editData: PerfilData['editData'];
  gestores: GestorItem[];
  onLoadEditData: () => Promise<void>;
  onOpenIcons: () => void;
  onOpenXpInfo: () => void;
  onOpenConquistas: () => void;
}

/** Card-dashboard do topo: avatar hexagonal, identidade, XP, sociais, stats, bio e habilidades. */
export function ProfileHero({
  nome,
  meta,
  funcaoPrincipal,
  foto,
  level,
  xp,
  xpNext,
  xpPct,
  activeIcon,
  checkpoints,
  acoesCount,
  achUnlocked,
  achTotal,
  miniBio,
  habilidades,
  habilidadesCombo,
  onAddHabilidade,
  onRemoveHabilidade,
  saving,
  onSave,
  editData,
  gestores,
  onLoadEditData,
  onOpenIcons,
  onOpenXpInfo,
  onOpenConquistas,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draftNome, setDraftNome] = useState(nome);
  const [draftFuncao, setDraftFuncao] = useState(funcaoPrincipal ?? '');
  const [draftBio, setDraftBio] = useState(miniBio ?? '');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftTelefone, setDraftTelefone] = useState('');
  const [draftGestor, setDraftGestor] = useState<string>('');
  const [draftIdioma, setDraftIdioma] = useState<number>(1);
  const [draftFoto, setDraftFoto] = useState<string | undefined>(foto);
  const [fotoErro, setFotoErro] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fotoExibida = editing ? draftFoto : foto;

  // Quando o snapshot completo chega (lazy), popula os campos que o hero não tem.
  useEffect(() => {
    if (editing && editData) {
      setDraftEmail(editData.email);
      setDraftTelefone(editData.telefone);
      setDraftFuncao((prev) => prev || editData.funcaoPrincipal);
      setDraftGestor(editData.idGestor ?? '');
      setDraftIdioma(editData.idioma || 1);
    }
  }, [editing, editData]);

  async function entrarEdicao() {
    setDraftNome(nome);
    setDraftFuncao(funcaoPrincipal ?? '');
    setDraftBio(miniBio ?? '');
    setDraftFoto(foto);
    setFotoErro(null);
    setEditing(true);
    await onLoadEditData();
  }

  function cancelar() {
    setEditing(false);
    setFotoErro(null);
  }

  async function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-selecionar mesmo arquivo
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFotoErro('Selecione uma imagem.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFotoErro('Imagem acima de 5 MB.');
      return;
    }
    setFotoErro(null);
    setDraftFoto(await fileToDataUri(file));
  }

  async function salvar() {
    const patch: ProfilePatch = {};
    if (draftNome.trim() && draftNome.trim() !== nome) patch.nome = draftNome.trim();
    if (draftFuncao.trim() !== (funcaoPrincipal ?? '')) patch.funcaoPrincipal = draftFuncao.trim();
    if (draftBio !== (miniBio ?? '')) patch.miniBio = draftBio;
    if (editData) {
      if (draftEmail.trim() !== editData.email) patch.email = draftEmail.trim();
      if (draftTelefone.trim() !== editData.telefone) patch.telefone = draftTelefone.trim();
      if ((draftGestor || null) !== editData.idGestor) patch.idGestor = draftGestor || null;
      if (draftIdioma !== editData.idioma) patch.idioma = draftIdioma;
    }
    // foto só vai quando trocada (data URI); URL atual o backend mantém.
    if (draftFoto && draftFoto !== foto && draftFoto.includes('base64')) patch.foto = draftFoto;

    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }
    const ok = await onSave(patch);
    if (ok) setEditing(false);
  }

  return (
    <div className={`pfx-hero${editing ? ' pfx-hero--editing' : ''}`}>
      {/* Botão de edição: absolute no canto sup. direito, não atrapalha os stats */}
      {!editing && (
        <button
          type="button"
          className="pfx-hero__edit-btn"
          onClick={entrarEdicao}
          title="Editar perfil"
          aria-label="Editar perfil"
        >
          ✏️
        </button>
      )}

      <button
        type="button"
        className={`pfx-hex${editing ? ' pfx-hex--editing' : ''}`}
        onClick={editing ? () => fileInputRef.current?.click() : onOpenIcons}
        title={editing ? 'Trocar foto' : 'Trocar moldura/ícone'}
        aria-label={editing ? 'Trocar foto do perfil' : 'Trocar variante de ícone'}
      >
        <span className="pfx-hex__shape">
          {fotoExibida ? (
            <img className="pfx-hex__img" src={fotoExibida} alt={nome} />
          ) : (
            <BeeforLogo size={72} style={{ color: activeIcon.color }} />
          )}
        </span>
        {editing && (
          <span className="pfx-hex__overlay" aria-hidden="true">
            <span className="pfx-hex__overlay-pencil">✏️</span>
          </span>
        )}
        {!editing && <span className="pfx-hex__lv">LVL {level}</span>}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={escolherFoto} />

      {/* Linha superior: identidade + sociais + stats/form */}
      <div className="pfx-hero__top">
        <div className="pfx-hero__left">
          <div className="pfx-hero__id">
            <div className="pfx-hero__main">
              {editing ? (
                <>
                  <input
                    className="pfx-hero__name-input"
                    value={draftNome}
                    onChange={(e) => setDraftNome(e.target.value)}
                    placeholder="Seu nome"
                    maxLength={200}
                  />
                  {fotoErro && <span className="pfx-hero__foto-erro">⚠️ {fotoErro}</span>}
                </>
              ) : (
                <>
                  <strong className="pfx-hero__name">{nome}</strong>
                  {meta && <span className="pfx-hero__meta">{meta}</span>}
                </>
              )}

              {!editing && (
                <div className="pfx-hero__chips">
                  <span className="pfx-tag">Beta tester</span>
                </div>
              )}

              {!editing && <XPBar xp={xp} xpNext={xpNext} pct={xpPct} onHelp={onOpenXpInfo} />}
            </div>

            <SocialLinks />
          </div>

          {/* mini bio: sob o hexágono */}
          <div className="pfx-hero__bio">
            <BioCard bio={editing ? draftBio : miniBio} editing={editing} onChange={setDraftBio} />
          </div>
        </div>

        {/* coluna direita: em modo normal = stats + habilidades; em edição = form de campos */}
        <div className="pfx-hero__right">
          {editing ? (
            <PfxCard title="✏️ Editar dados">
              {/* Form sempre montado; campos preenchem quando editData chega (sem tela de loading) */}
              <div className="pfx-edit-form">
                <label className="pfx-edit-field">
                  <span>Função principal</span>
                  <input
                    value={draftFuncao}
                    onChange={(e) => setDraftFuncao(e.target.value)}
                    placeholder="Função principal"
                    maxLength={200}
                  />
                </label>
                <label className="pfx-edit-field">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    maxLength={254}
                  />
                </label>
                <label className="pfx-edit-field">
                  <span>Telefone</span>
                  <input
                    value={draftTelefone}
                    onChange={(e) => setDraftTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    maxLength={20}
                  />
                </label>
                <label className="pfx-edit-field">
                  <span>Gestor</span>
                  <select value={draftGestor} onChange={(e) => setDraftGestor(e.target.value)}>
                    <option value="">Selecione</option>
                    {gestores.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="pfx-edit-field">
                  <span>Idioma</span>
                  <select
                    value={draftIdioma}
                    onChange={(e) => setDraftIdioma(Number(e.target.value))}
                  >
                    {IDIOMAS.map((i) => (
                      <option key={i.value} value={i.value}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="pfx-edit-actions">
                  <button
                    type="button"
                    className="pfx-btn pfx-btn--ghost"
                    onClick={cancelar}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="pfx-btn pfx-btn--primary"
                    onClick={salvar}
                    disabled={saving}
                  >
                    {saving ? 'Salvando…' : 'Salvar'}
                  </button>
                </div>
              </div>
            </PfxCard>
          ) : (
            <>
              <div className="pfx-hero__stats">
                <StatsCard
                  iconKind="trophy"
                  value={`${achUnlocked}/${achTotal}`}
                  label="Conquistas"
                  onClick={onOpenConquistas}
                />
                <StatsCard iconKind="check" value={checkpoints} label="Checkpoints" />
                <StatsCard iconKind="action" value={acoesCount} label="Ações" />
              </div>

              <div className="pfx-hero__skills">
                <PfxCard title="🛠️ Habilidades">
                  <HabilidadesBlock
                    habilidades={habilidades}
                    combo={habilidadesCombo}
                    onAdd={onAddHabilidade}
                    onRemove={onRemoveHabilidade}
                  />
                </PfxCard>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
