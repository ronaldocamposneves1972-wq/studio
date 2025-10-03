export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'Admin' | 'Gestor' | 'Atendente' | 'Financeiro';
};

export type ClientStatus = 'Novo' | 'Em análise' | 'Pendente' | 'Aprovado' | 'Reprovado';

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: ClientStatus;
  createdAt: string;
  avatarUrl: string;
  income: number;
  salesRep: User;
  timeline: TimelineEvent[];
  quizId?: string; // Optional: ID of the quiz the client took
  answers?: Record<string, any>; // Optional: Client's answers to the quiz
};

export type TimelineEvent = {
  id: string;
  timestamp: string;
  activity: string;
  details?: string;
  user: {
    name: string;
    avatarUrl: string;
  }
};

export type ProposalStatus = 'Aberta' | 'Em negociação' | 'Finalizada' | 'Cancelada';

export type Proposal = {
  id: string;
  clientName: string;
  productName: string;
  value: number;
  status: ProposalStatus;
  createdAt: string;
  salesRepName: string;
};

export type Product = {
  id: string;
  name: string;
  type: 'Consórcio' | 'Crédito';
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  terms: number[];
  imageUrl: string;
};

export type Bank = {
  id: string;
  name: string;
  logoUrl: string;
  commissionRate: number;
  approvedVolume: number;
  sentVolume: number;
};

export type QuizQuestion = {
    id: string;
    text: string;
    type: 'text' | 'number' | 'email' | 'tel' | 'radio' | 'checkbox' | 'file';
    options?: string[];
};

export type QuizPlacement = 'landing_page' | 'client_link';

export type Quiz = {
    id: string;
    name: string;
    questions: QuizQuestion[];
    placement?: QuizPlacement;
};
