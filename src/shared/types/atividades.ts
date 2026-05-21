export interface BeeforAtividade {
  id: string;
  idQuadro: string;
  /** idTime do board onde card vive — necessário para fetch detail via API. */
  idTime?: string;
  /** idOrganizacao do card (opcional; cai pra sessão atual se faltar). */
  idOrganizacao?: string;
  nome: string;
  tipo: number;
  projeto: string;
  timeBoard: string;
  momento: string;
  dataCriacao: string;
  numeroCard: string;
}
