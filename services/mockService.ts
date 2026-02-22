
import { 
  Customer, 
  Space, 
  Booking, 
  IApiService, 
  EntityStatus, 
  BookingStatus, 
  BookingType, 
  ApprovalStatus,
  DashboardKPIs,
  Plan,
  Subscription,
  SubscriptionStatus,
  Payment,
  Responsible,
  Attachment
} from './types';

const STORAGE_KEYS = {
  CUSTOMERS: 'reserva_customers',
  SPACES: 'reserva_spaces',
  BOOKINGS: 'reserva_bookings',
  PLANS: 'reserva_plans',
  SUBSCRIPTIONS: 'reserva_subscriptions',
  PAYMENTS: 'reserva_payments',
  RESPONSIBLES: 'reserva_responsibles',
  SESSION: 'reserva_session',
};

const delay = (ms: number = 400) => new Promise(resolve => setTimeout(resolve, ms));

const seedData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    const customers: Customer[] = [
      { 
        id: '1', 
        name: 'Santa Casa da Misericórdia de Lisboa', 
        email: 'geral@scml.pt', 
        contacts: [
           { id: 'c1', name: 'Dr. António Costa', rgpd_consent: true, email: 'antonio@scml.pt', phone: '+351 213 235 000' }
        ],
        attachments: [],
        // Legacy fields for compat
        company: 'Dr. António Costa', 
        phone: '+351 213 235 000', 
        status: EntityStatus.ACTIVE, 
        notes: 'Cliente principal', 
        createdAt: new Date().toISOString() 
      },
      { 
        id: '2', 
        name: 'Tech Solutions Portugal', 
        email: 'contato@techsolutions.pt', 
        contacts: [
            { id: 'c2', name: 'Maria Silva', rgpd_consent: false, email: 'maria@tech.pt', phone: '+351 912 345 678' }
        ],
        attachments: [],
        // Legacy fields for compat
        company: 'Maria Silva', 
        phone: '+351 912 345 678', 
        status: EntityStatus.ACTIVE, 
        notes: '', 
        createdAt: new Date().toISOString() 
      },
    ];
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.RESPONSIBLES)) {
    const responsibles: Responsible[] = [
      { id: '1', name: 'Carlos Santos', email: 'carlos.santos@scml.pt', phone: '912 000 100', role: 'Gestor de Eventos Principal' },
      { id: '2', name: 'Ana Oliveira', email: 'ana.oliveira@scml.pt', phone: '912 000 200', role: 'Coordenadora de Logística' },
    ];
    localStorage.setItem(STORAGE_KEYS.RESPONSIBLES, JSON.stringify(responsibles));
  }

  if (!localStorage.getItem(STORAGE_KEYS.SPACES)) {
    const spaces: Space[] = [
      { 
        id: '1', 
        name: 'Auditório Principal', 
        address: 'Largo Trindade Coelho, 1200-470 Lisboa',
        googleMapLink: 'https://maps.app.goo.gl/example1',
        capacity: 100, 
        extras: 'Projetor, Som, Ar Condicionado', 
        images: [
          'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80'
        ], 
        description: 'Espaço amplo para palestras e conferências.', 
        active: true 
      },
      { 
        id: '2', 
        name: 'Sala de Reunião 01', 
        address: 'Rua das Taipas 1, 1250-264 Lisboa',
        googleMapLink: 'https://maps.app.goo.gl/example2',
        capacity: 10, 
        extras: 'TV, Quadro Branco', 
        images: [
          'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&q=80'
        ], 
        description: 'Ideal para reuniões executivas.', 
        active: true 
      },
    ];
    localStorage.setItem(STORAGE_KEYS.SPACES, JSON.stringify(spaces));
  }

  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
    // Configurar datas exemplo
    const startEvent = tomorrow.toISOString();
    const endEvent = new Date(tomorrow.getTime() + 3600000).toISOString();
    // Montagem 2 horas antes
    const setupDate = new Date(tomorrow.getTime() - 7200000).toISOString();
    // Desmontagem 2 horas depois
    const breakdownDate = new Date(tomorrow.getTime() + 10800000).toISOString();

    const bookings: Booking[] = [
      { 
        id: '1', 
        space_id: '1', 
        customer_id: '1', 
        start_date: startEvent, 
        end_date: endEvent,
        setup_date: setupDate,
        breakdown_date: breakdownDate,
        responsible: 'Carlos Santos', 
        event_name: 'Workshop Institucional', 
        description: 'Evento anual de alinhamento estratégico com parceiros.',
        status: BookingStatus.CONFIRMED,
        type: BookingType.PAID,
        approval_status: ApprovalStatus.AUTHORIZED,
        contact_name: 'João Pereira',
        contact_email: 'joao.pereira@exemplo.com',
        price: 150.00,
        attendees: 45,
        situation_notes: 'Catering confirmado. Aguarda lista final de participantes.',
        createdAt: now.toISOString()
      },
    ];
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }
};

seedData();

const getFromStorage = <T,>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveToStorage = <T,>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const mockService: IApiService = {
  login: async (email, password) => {
    await delay(600);
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ email, token: 'fake-jwt' }));
    return true;
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },
  isAuthenticated: () => {
    return !!localStorage.getItem(STORAGE_KEYS.SESSION);
  },

  getCustomers: async () => {
    await delay();
    return getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
  },
  createCustomer: async (data) => {
    await delay();
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const newCustomer: Customer = { 
        ...data, 
        id: Math.random().toString(36).substr(2, 9), 
        createdAt: new Date().toISOString(),
        attachments: data.attachments || [] 
    };
    saveToStorage(STORAGE_KEYS.CUSTOMERS, [...customers, newCustomer]);
    return newCustomer;
  },
  updateCustomer: async (id, data) => {
    await delay();
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Customer not found');
    const updated = { ...customers[index], ...data };
    customers[index] = updated;
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
    return updated;
  },
  deleteCustomer: async (id) => {
    await delay();
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS).filter(c => c.id !== id);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
  },

  getResponsibles: async () => {
    await delay();
    return getFromStorage<Responsible>(STORAGE_KEYS.RESPONSIBLES);
  },
  createResponsible: async (data) => {
    await delay();
    const resps = getFromStorage<Responsible>(STORAGE_KEYS.RESPONSIBLES);
    const newResp: Responsible = { ...data, id: Math.random().toString(36).substr(2, 9) };
    saveToStorage(STORAGE_KEYS.RESPONSIBLES, [...resps, newResp]);
    return newResp;
  },
  updateResponsible: async (id, data) => {
    await delay();
    const resps = getFromStorage<Responsible>(STORAGE_KEYS.RESPONSIBLES);
    const index = resps.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Responsible not found');
    const updated = { ...resps[index], ...data };
    resps[index] = updated;
    saveToStorage(STORAGE_KEYS.RESPONSIBLES, resps);
    return updated;
  },
  deleteResponsible: async (id) => {
    await delay();
    const resps = getFromStorage<Responsible>(STORAGE_KEYS.RESPONSIBLES).filter(r => r.id !== id);
    saveToStorage(STORAGE_KEYS.RESPONSIBLES, resps);
  },

  getSpaces: async () => {
    await delay();
    // Migration helper for old data structure in local storage if necessary
    const spaces = getFromStorage<any>(STORAGE_KEYS.SPACES);
    const fixedSpaces = spaces.map(s => {
      let mapped = { ...s };
      if (!mapped.images && mapped.imageUrl) {
        mapped.images = [mapped.imageUrl];
      }
      if (!mapped.address) {
        mapped.address = '';
      }
      if (!mapped.googleMapLink) {
        mapped.googleMapLink = '';
      }
      return mapped as Space;
    });
    return fixedSpaces;
  },
  createSpace: async (data) => {
    await delay();
    const spaces = getFromStorage<Space>(STORAGE_KEYS.SPACES);
    const newSpace: Space = { ...data, id: Math.random().toString(36).substr(2, 9) };
    saveToStorage(STORAGE_KEYS.SPACES, [...spaces, newSpace]);
    return newSpace;
  },
  updateSpace: async (id, data) => {
    await delay();
    const spaces = getFromStorage<Space>(STORAGE_KEYS.SPACES);
    const index = spaces.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Space not found');
    const updated = { ...spaces[index], ...data };
    spaces[index] = updated;
    saveToStorage(STORAGE_KEYS.SPACES, spaces);
    return updated;
  },
  deleteSpace: async (id) => {
    await delay();
    const spaces = getFromStorage<Space>(STORAGE_KEYS.SPACES).filter(s => s.id !== id);
    saveToStorage(STORAGE_KEYS.SPACES, spaces);
  },

  getBookings: async () => {
    await delay();
    return getFromStorage<Booking>(STORAGE_KEYS.BOOKINGS);
  },
  createBooking: async (data) => {
    await delay();
    const bookings = getFromStorage<Booking>(STORAGE_KEYS.BOOKINGS);
    
    // Generate Sequential ID
    const maxId = bookings.reduce((max, item) => {
      const idNum = parseInt(item.id, 10);
      return !isNaN(idNum) && idNum > max ? idNum : max;
    }, 0);
    const nextId = (maxId + 1).toString();

    const newBooking: Booking = { 
      ...data, 
      id: nextId,
      createdAt: data.createdAt || new Date().toISOString()
    };
    saveToStorage(STORAGE_KEYS.BOOKINGS, [...bookings, newBooking]);
    return newBooking;
  },
  updateBooking: async (id, data) => {
    await delay();
    const bookings = getFromStorage<Booking>(STORAGE_KEYS.BOOKINGS);
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Booking not found');
    const updated = { ...bookings[index], ...data };
    bookings[index] = updated;
    saveToStorage(STORAGE_KEYS.BOOKINGS, bookings);
    return updated;
  },
  deleteBooking: async (id) => {
    await delay();
    const bookings = getFromStorage<Booking>(STORAGE_KEYS.BOOKINGS).filter(b => b.id !== id);
    saveToStorage(STORAGE_KEYS.BOOKINGS, bookings);
  },
  checkBookingExpirations: async () => {
    const bookings = getFromStorage<Booking>(STORAGE_KEYS.BOOKINGS);
    const now = new Date();
    let updated = false;
    const newBookings = bookings.map(b => {
      if (b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.EXPIRED && new Date(b.end_date) < now) {
        updated = true;
        return { ...b, status: BookingStatus.EXPIRED };
      }
      return b;
    });
    if (updated) saveToStorage(STORAGE_KEYS.BOOKINGS, newBookings);
  },

  getPlans: async () => {
    await delay();
    return getFromStorage<Plan>(STORAGE_KEYS.PLANS);
  },
  createPlan: async (data) => {
    await delay();
    const plans = getFromStorage<Plan>(STORAGE_KEYS.PLANS);
    const newPlan: Plan = { ...data, id: Math.random().toString(36).substr(2, 9) };
    saveToStorage(STORAGE_KEYS.PLANS, [...plans, newPlan]);
    return newPlan;
  },
  updatePlan: async (id, data) => {
    await delay();
    const plans = getFromStorage<Plan>(STORAGE_KEYS.PLANS);
    const index = plans.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Plan not found');
    const updated = { ...plans[index], ...data };
    plans[index] = updated;
    saveToStorage(STORAGE_KEYS.PLANS, plans);
    return updated;
  },
  deletePlan: async (id) => {
    await delay();
    const plans = getFromStorage<Plan>(STORAGE_KEYS.PLANS).filter(p => p.id !== id);
    saveToStorage(STORAGE_KEYS.PLANS, plans);
  },

  getSubscriptions: async () => {
    await delay();
    return getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
  },
  createSubscription: async (data) => {
    await delay();
    const subs = getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
    const newSub: Subscription = { ...data, id: Math.random().toString(36).substr(2, 9) };
    saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, [...subs, newSub]);
    return newSub;
  },
  updateSubscription: async (id, data) => {
    await delay();
    const subs = getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
    const index = subs.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Subscription not found');
    const updated = { ...subs[index], ...data };
    subs[index] = updated;
    saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subs);
    return updated;
  },
  deleteSubscription: async (id) => {
    await delay();
    const subs = getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS).filter(s => s.id !== id);
    saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subs);
  },
  markOverdueSubscriptions: async () => {
    const subs = getFromStorage<Subscription>(STORAGE_KEYS.SUBSCRIPTIONS);
    const now = new Date();
    let updated = false;
    const newSubs = subs.map(s => {
      if (s.status === SubscriptionStatus.ACTIVE && new Date(s.next_renewal) < now) {
        updated = true;
        return { ...s, status: SubscriptionStatus.OVERDUE };
      }
      return s;
    });
    if (updated) saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, newSubs);
  },

  getPayments: async () => {
    await delay();
    return getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
  },
  createPayment: async (data) => {
    await delay();
    const payments = getFromStorage<Payment>(STORAGE_KEYS.PAYMENTS);
    const newPayment: Payment = { ...data, id: Math.random().toString(36).substr(2, 9) };
    saveToStorage(STORAGE_KEYS.PAYMENTS, [...payments, newPayment]);
    return newPayment;
  },

  getDashboardKPIs: async () => {
    await delay();
    const customers = getFromStorage<Customer>(STORAGE_KEYS.CUSTOMERS);
    const spaces = getFromStorage<Space>(STORAGE_KEYS.SPACES);
    const bookings = getFromStorage<Booking>(STORAGE_KEYS.BOOKINGS);
    const resps = getFromStorage<Responsible>(STORAGE_KEYS.RESPONSIBLES);

    const bookingsByStatus: Record<BookingStatus, number> = {
      [BookingStatus.PENDING]: 0,
      [BookingStatus.CONFIRMED]: 0,
      [BookingStatus.CANCELLED]: 0,
      [BookingStatus.EXPIRED]: 0,
      [BookingStatus.VISIT]: 0,
    };

    const bookingsByResponsible: Record<string, number> = {};

    bookings.forEach(b => {
      if (bookingsByStatus[b.status] !== undefined) {
        bookingsByStatus[b.status]++;
      }
      if (b.responsible) {
        bookingsByResponsible[b.responsible] = (bookingsByResponsible[b.responsible] || 0) + 1;
      }
    });

    return {
      totalCustomers: customers.length,
      totalSpaces: spaces.length,
      totalBookings: bookings.length,
      totalResponsibles: resps.length,
      bookingsByStatus,
      bookingsByResponsible,
    };
  }
};
