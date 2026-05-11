export interface TeamChecklistAnswer {
  titulo: string;
  resposta: string;
}

export interface TeamMember {
  nome: string;
  foto: string;
  funcaoPrincipal: string;
  email: string;
  status: boolean;
  ultimoCliente: string | null;
  ultimoCheckpoint: string | null;
  respostasUltimoChecklist: TeamChecklistAnswer[];
}
