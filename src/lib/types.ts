

type CollectionKey = typeof collections[number];

export type Permissions = Record<CollectionKey, {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}>

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'Admin' | 'Gestor' | 'Atendente' | 'Financeiro';
  permissions?: Permissions;
};

export type ClientStatus = 'Novo' | 'Em análise' | 'Pendente' | 'Aprovado' | 'Reprovado' | 'Ledger';

export type DocumentStatus = 'pending' | 'validated' | 'rejected';

export type ClientDocument = {
  id: string; // The unique ID for the document entry in Firestore
  clientId: string;
  fileUrl: string; // The public URL for viewing/downloading the file
  original_filename: string;
  filename: string; // The filename as stored in the external service
  folder?: string; // The folder path in the external service
  uploadedAt: string;
  validationStatus?: DocumentStatus;
  statusUpdatedAt?: string;
  validatedBy?: string;
  validatedAt?: string;
  fileType?: string; // e.g., 'image', 'pdf', etc.
};

export type ProposalSummary = {
  id: string;
  productId: string;
  productName: string;
  bankName?: string;
  value: number;
  installments?: number;
  installmentValue?: number;
  status: ProposalStatus;
  createdAt: string;
  approvedAt?: string;
  formalizationLink?: string;
}

export type SalesOrderSummary = {
  id: string;
  createdAt: string;
  dueDate: string;
  totalValue: number;
  itemCount: number;
}

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
  proposals?: ProposalSummary[];
  salesOrders?: SalesOrderSummary[];
  cpf?: string;
  birthDate?: string;
  motherName?: string;
  cep?: string;
  address?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  reprovalDate?: string;
};

export type TimelineEvent = {
  id: string;
  timestamp: string;
  activity: string;
  details?: string;
  user: {
    name:string;
    avatarUrl?: string;
  }
};

export type ProposalStatus = 'Aberta' | 'Em negociação' | 'Finalizada' | 'Cancelada';

export type Proposal = {
  id: string;
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  bankName?: string;
  value: number;
  installments?: number;
  installmentValue?: number;
  status: ProposalStatus;
  createdAt: string;
  approvedAt?: string;
  salesRepId: string;
  salesRepName: string;
  formalizationLink?: string;
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

export type ProductBehavior = 'Fixo' | 'Variável' | 'Proposta';
export type CommissionBase = 'liquido' | 'bruto';

type ProductBase = {
  id: string;
  name: string;
  behavior: ProductBehavior;
  bankId: string;
  bankName: string;
}

type ProductFixo = ProductBase & {
  behavior: 'Fixo';
  value: number;
}

type ProductVariavel = ProductBase & {
  behavior: 'Variável';
  value: number;
}

type ProductProposta = ProductBase & {
  behavior: 'Proposta';
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  terms: number[];
  commissionRate: number;
  commissionBase: CommissionBase;
}

export type Product = ProductFixo | ProductVariavel | ProductProposta;


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
    type: 'text' | 'number' | 'email' | 'tel' | 'radio' | 'checkbox' | 'file' | 'cep' | 'address' | 'address_number' | 'address_complement' | 'cpf' | 'birthdate';
    options?: string[];
};

export type QuizPlacement = 'landing_page' | 'client_link';

export type Quiz = {
    id: string;
    name: string;
    slug: 'landing_page' | 'credito-pessoal' | 'credito-clt' | 'antecipacao-fgts' | 'refinanciamento' | 'client_link';
    ownerId?: string;
    questions: QuizQuestion[];
    createdAt?: string;
    whatsappTemplateId?: string;
};

export type Account = {
  id: string;
  name: string;
  bankName: string;
  balance: number;
  type: 'checking' | 'savings' | 'digital' | 'cash';
};

export type Supplier = {
  id: string;
  name: string;
  type: 'Empresa' | 'Funcionário';
  cnpjCpf?: string;
  contactName?: string;
  phone?: string;
  email?: string;
}

export type CostCenter = {
  id: string;
  name: string;
};

export type ExpenseCategory = {
    id: string;
    name: string;
    costCenterId?: string;
    costCenterName?: string;
}

export type WhatsappMessageStage = "Cadastro (Quiz)" | "Documentação" | "Valor" | "Clearance" | "Ledger" | "Manual";

export type WhatsappMessageTemplate = {
  id: string;
  name: string;
  text: string;
  apiUrl: string;
  sessionName: string;
  stage: WhatsappMessageStage;
  placeholders?: string[];
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
  clientId?: string;
  clientName?: string;
  supplierId?: string;
  supplierName?: string;
  costCenterId?: string;
  costCenterName?: string;
  categoryId?: string;
  category?: string;
};

export type SalesOrderItem = {
  productId: string;
  productName: string;
  value: number;
}

export type SalesOrder = {
  id: string;
  clientId: string;
  clientName: string;
  salesRepId: string;
  salesRepName: string;
  createdAt: string;
  dueDate: string;
  items: SalesOrderItem[];
  totalValue: number;
}

export const collections = [
  'clients',
  'products',
  'sales_proposals',
  'transactions',
  'users',
  'suppliers',
  'cost_centers',
  'expense_categories',
  'quizzes',
  'financial_institutions',
  'commissions',
  'whatsapp_templates'
] as const;
