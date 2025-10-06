

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'Admin' | 'Gestor' | 'Atendente' | 'Financeiro';
};

export type ClientStatus = 'Novo' | 'Em análise' | 'Pendente' | 'Aprovado' | 'Reprovado';

export type DocumentStatus = 'pending' | 'validated' | 'rejected';

export type ClientDocument = {
  id: string;
  clientId: string;
  fileType: string;
  fileName: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  uploadedAt: string;
  validationStatus?: DocumentStatus;
  statusUpdatedAt?: string;
  validatedBy?: string;
  validatedAt?: string;
};

export type Client = {
  id: string;
  name: string; // Full name
  email: string;
  phone: string;
  status: ClientStatus;
  createdAt: string;
  avatarUrl?: string;
  income?: number;
  salesRep?: User;
  timeline?: TimelineEvent[];
  quizId?: string; // Optional: ID of the quiz the client took
  answers?: Record<string, any>; // Optional: Client's answers to the quiz
  documents?: ClientDocument[];
  cpf?: string;
  birthDate?: string;
  motherName?: string;
  cep?: string;
  address?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

export type TimelineEvent = {
  id: string;
  timestamp: string;
  activity: string;
  details?: string;
  user: {
    name: string;
    avatarUrl?: string;
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

export type ProductType = {
  id: string;
  name: string;
  description?: string;
};

export type FinancialInstitution = {
  id: string;
  name: string;
  logoUrl?: string;
};

export type Product = {
  id: string;
  name: string;
  type: 'Consórcio' | 'Crédito' | string;
  productTypeId: string; // Reference to ProductType
  bankId: string; // Reference to FinancialInstitution
  bankName?: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  commissionRate: number;
  terms: number[];
};

export type Bank = {
  id: string;
  name: string;
  logoUrl: string;
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
    ownerId?: string;
    questions: QuizQuestion[];
    placement: QuizPlacement;
    createdAt?: string;
};

export type Account = {
  id: string;
  name: string;
  bankName: string;
  balance: number;
  type: 'checking' | 'savings' | 'digital' | 'cash';
};

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  paymentDate?: string;
  accountId: string;
  accountName?: string;
};

    