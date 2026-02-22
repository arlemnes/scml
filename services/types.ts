
export enum EntityStatus {
  ACTIVE = 'ativo',
  INACTIVE = 'inativo',
}

export enum BookingStatus {
  PENDING = 'pendente',
  CONFIRMED = 'confirmada',
  CANCELLED = 'cancelada',
  EXPIRED = 'vencida',
  VISIT = 'visita',
}

export enum BookingType {
  PAID = 'paga',
  FREE = 'gratuita',
}

export enum ApprovalStatus {
  PENDING = 'pendente', // Estado inicial (------------)
  AUTHORIZED = 'autorizado',
  FREE_CESSION = 'cedencia_gratuita',
  NOT_AUTHORIZED = 'nao_autorizado',
  DM = 'dm', // Direção / Decisão Superior
}

export enum SubscriptionStatus {
  ACTIVE = 'ativa',
  OVERDUE = 'vencida',
  CANCELLED = 'cancelada',
}

export interface Attachment {
  id: string;
  name: string;
  size: number; // em bytes
  type: string; // MIME type
  uploadedAt: string;
}

export interface ContactPerson {
  id: string;
  name: string;
  rgpd_consent: boolean; // Substituiu 'role' (Cargo)
  email: string;
  phone: string;
}

export interface Customer {
  id: string;
  name: string; // Nome da Empresa / Entidade
  email: string; // Email Geral da Entidade
  contacts: ContactPerson[]; // Lista de Pessoas de Contacto
  attachments?: Attachment[]; // Pasta de Anexos do Cliente (Contratos, NIF, etc)
  
  // Legacy fields (kept for backward compatibility during migration)
  company?: string; // Antigo: Pessoa de Contacto (Geral)
  phone?: string;   // Antigo: Telefone Geral
  
  status: EntityStatus;
  notes: string;
  createdAt: string;
}

export interface Responsible {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string; // Cargo/Função Interna
}

export interface Space {
  id: string;
  name: string;
  address: string; // Morada por extenso
  googleMapLink: string; // Nova propriedade: Link para o Google Maps
  capacity: number;
  extras: string;
  images: string[]; 
  description: string;
  active: boolean;
}

export interface Booking {
  id: string;
  space_id: string;
  customer_id: string;
  start_date: string;
  end_date: string;
  setup_date?: string; // Data de Montagem
  breakdown_date?: string; // Data de Desmontagem
  responsible: string; // Nome do gestor interno
  event_name: string;
  description?: string; // Descrição detalhada do evento
  situation_notes?: string; // Observações / Ponto de Situação
  status: BookingStatus;
  type: BookingType; // Tipo de Cedência: Paga ou Gratuita
  approval_status?: ApprovalStatus; // Aprovação Interna
  contact_name?: string; // Nome de contacto para o evento
  contact_email?: string; // Email de contacto para o evento
  price: number;
  attendees: number;
  createdAt?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

export interface Subscription {
  id: string;
  customer_id: string;
  plan_id: string;
  start_date: string;
  next_renewal: string;
  status: SubscriptionStatus;
}

export interface Payment {
  id: string;
  subscription_id: string;
  amount: number;
  paid_at: string;
}

export interface DashboardKPIs {
  totalCustomers: number;
  totalSpaces: number;
  totalBookings: number;
  totalResponsibles: number;
  bookingsByStatus: Record<BookingStatus, number>;
  bookingsByResponsible: Record<string, number>;
}

export interface IApiService {
  // Auth (Mock)
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: () => boolean;

  // Customers (Empresas/Entidades)
  getCustomers: () => Promise<Customer[]>;
  createCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;

  // Responsibles (Staff Interno)
  getResponsibles: () => Promise<Responsible[]>;
  createResponsible: (data: Omit<Responsible, 'id'>) => Promise<Responsible>;
  updateResponsible: (id: string, data: Partial<Responsible>) => Promise<Responsible>;
  deleteResponsible: (id: string) => Promise<void>;

  // Spaces
  getSpaces: () => Promise<Space[]>;
  createSpace: (data: Omit<Space, 'id'>) => Promise<Space>;
  updateSpace: (id: string, data: Partial<Space>) => Promise<Space>;
  deleteSpace: (id: string) => Promise<void>;

  // Bookings
  getBookings: () => Promise<Booking[]>;
  createBooking: (data: Omit<Booking, 'id'>) => Promise<Booking>;
  updateBooking: (id: string, data: Partial<Booking>) => Promise<Booking>;
  deleteBooking: (id: string) => Promise<void>;
  checkBookingExpirations: () => Promise<void>;

  // Plans
  getPlans: () => Promise<Plan[]>;
  createPlan: (data: Omit<Plan, 'id'>) => Promise<Plan>;
  updatePlan: (id: string, data: Partial<Plan>) => Promise<Plan>;
  deletePlan: (id: string) => Promise<void>;

  // Subscriptions
  getSubscriptions: () => Promise<Subscription[]>;
  createSubscription: (data: Omit<Subscription, 'id'>) => Promise<Subscription>;
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<Subscription>;
  deleteSubscription: (id: string) => Promise<void>;
  markOverdueSubscriptions: () => Promise<void>;

  // Payments
  getPayments: () => Promise<Payment[]>;
  createPayment: (data: Omit<Payment, 'id'>) => Promise<Payment>;

  // Dashboard
  getDashboardKPIs: () => Promise<DashboardKPIs>;
}
