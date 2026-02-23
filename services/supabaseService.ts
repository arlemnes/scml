import { IApiService, Customer, Responsible, Space, Booking, Plan, Subscription, Payment, DashboardKPIs, BookingStatus } from './types';
import { supabase } from './supabaseClient';

export const supabaseService: IApiService = {
  // Auth via Supabase Auth
  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return true;
  },
  logout: async () => {
    await supabase.auth.signOut();
  },
  isAuthenticated: () => true,

  // Customers
  getCustomers: async () => {
    const { data, error } = await supabase.from('customers').select('*').order('createdAt', { ascending: false });
    if (error) throw error;
    return data as Customer[];
  },
  createCustomer: async (data) => {
    const { data: newCustomer, error } = await supabase.from('customers').insert([data]).select().single();
    if (error) throw error;
    return newCustomer as Customer;
  },
  updateCustomer: async (id, data) => {
    const { data: updatedCustomer, error } = await supabase.from('customers').update(data).eq('id', id).select().single();
    if (error) throw error;
    return updatedCustomer as Customer;
  },
  deleteCustomer: async (id) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  },

  // Responsibles
  getResponsibles: async () => {
    const { data, error } = await supabase.from('responsibles').select('*');
    if (error) throw error;
    return data as Responsible[];
  },
  createResponsible: async (data) => {
    const { data: newResp, error } = await supabase.from('responsibles').insert([data]).select().single();
    if (error) throw error;
    return newResp as Responsible;
  },
  updateResponsible: async (id, data) => {
    const { data: updatedResp, error } = await supabase.from('responsibles').update(data).eq('id', id).select().single();
    if (error) throw error;
    return updatedResp as Responsible;
  },
  deleteResponsible: async (id) => {
    const { error } = await supabase.from('responsibles').delete().eq('id', id);
    if (error) throw error;
  },

  // Spaces
  getSpaces: async () => {
    const { data, error } = await supabase.from('spaces').select('*');
    if (error) throw error;

    // Parse the text-based images field back to an array
    const parsedData = (data as any[]).map(space => {
      let parsedImages = space.images;
      if (typeof space.images === 'string') {
        try { parsedImages = JSON.parse(space.images); } catch (e) { parsedImages = []; }
      }
      return { ...space, images: parsedImages };
    });

    return parsedData as Space[];
  },
  createSpace: async (data) => {
    // Stringify array for the TEXT column
    const payload = { ...data, images: Array.isArray(data.images) ? JSON.stringify(data.images) : data.images };
    const { data: newSpace, error } = await supabase.from('spaces').insert([payload]).select().single();
    if (error) throw error;
    return newSpace as Space;
  },
  updateSpace: async (id, data) => {
    // Stringify array for the TEXT column
    const payload = { ...data };
    if (payload.images && Array.isArray(payload.images)) {
      payload.images = JSON.stringify(payload.images) as any;
    }
    const { data: updatedSpace, error } = await supabase.from('spaces').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return updatedSpace as Space;
  },
  deleteSpace: async (id) => {
    const { error } = await supabase.from('spaces').delete().eq('id', id);
    if (error) throw error;
  },

  // Bookings
  getBookings: async () => {
    const { data, error } = await supabase.from('bookings').select('*').order('createdAt', { ascending: false });
    if (error) throw error;
    return data as Booking[];
  },
  createBooking: async (data) => {
    // Sanitize empty date strings to null so PostgreSQL doesn't crash
    const DATE_FIELDS = ['start_date', 'end_date', 'setup_date', 'breakdown_date', 'createdAt'];
    const payload: any = { ...data };
    for (const field of DATE_FIELDS) {
      if (field in payload && payload[field] === '') {
        payload[field] = null;
      }
    }
    const { data: newBooking, error } = await supabase.from('bookings').insert([payload]).select().single();
    if (error) throw error;
    return newBooking as Booking;
  },
  updateBooking: async (id, data) => {
    // Sanitize empty date strings to null so PostgreSQL doesn't crash
    const DATE_FIELDS = ['start_date', 'end_date', 'setup_date', 'breakdown_date', 'createdAt'];
    const payload: any = { ...data };
    for (const field of DATE_FIELDS) {
      if (field in payload && payload[field] === '') {
        payload[field] = null;
      }
    }
    const { data: updatedBooking, error } = await supabase.from('bookings').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return updatedBooking as Booking;
  },
  deleteBooking: async (id) => {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) throw error;
  },
  checkBookingExpirations: async () => {
    // Simple logic to update expired bookings on the client side based on data
    // Ideally this should be a DB cron job or Edge Function
    const now = new Date().toISOString();
    await supabase.from('bookings')
      .update({ status: BookingStatus.EXPIRED })
      .lt('end_date', now)
      .eq('status', BookingStatus.CONFIRMED);
    // Also check bookings queried with snake_case columns (now matches DB)
  },

  // Plans
  getPlans: async () => {
    const { data, error } = await supabase.from('plans').select('*');
    if (error) throw error;
    return data as Plan[];
  },
  createPlan: async (data) => {
    const { data: newPlan, error } = await supabase.from('plans').insert([data]).select().single();
    if (error) throw error;
    return newPlan as Plan;
  },
  updatePlan: async (id, data) => {
    const { data: updatedPlan, error } = await supabase.from('plans').update(data).eq('id', id).select().single();
    if (error) throw error;
    return updatedPlan as Plan;
  },
  deletePlan: async (id) => {
    const { error } = await supabase.from('plans').delete().eq('id', id);
    if (error) throw error;
  },

  // Subscriptions
  getSubscriptions: async () => {
    const { data, error } = await supabase.from('subscriptions').select('*');
    if (error) throw error;
    return data as Subscription[];
  },
  createSubscription: async (data) => {
    const { data: newSub, error } = await supabase.from('subscriptions').insert([data]).select().single();
    if (error) throw error;
    return newSub as Subscription;
  },
  updateSubscription: async (id, data) => {
    const { data: updatedSub, error } = await supabase.from('subscriptions').update(data).eq('id', id).select().single();
    if (error) throw error;
    return updatedSub as Subscription;
  },
  deleteSubscription: async (id) => {
    const { error } = await supabase.from('subscriptions').delete().eq('id', id);
    if (error) throw error;
  },
  markOverdueSubscriptions: async () => {
    const now = new Date().toISOString();
    await supabase.from('subscriptions')
      .update({ status: 'vencida' })
      .lt('next_renewal', now)
      .eq('status', 'ativa');
  },

  // Payments
  getPayments: async () => {
    const { data, error } = await supabase.from('payments').select('*');
    if (error) throw error;
    return data as Payment[];
  },
  createPayment: async (data) => {
    const { data: newPay, error } = await supabase.from('payments').insert([data]).select().single();
    if (error) throw error;
    return newPay as Payment;
  },

  // Dashboard
  getDashboardKPIs: async () => {
    const [
      { count: customersCount },
      { count: spacesCount },
      { count: responsiblesCount },
      { data: bookingsData }
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('spaces').select('*', { count: 'exact', head: true }),
      supabase.from('responsibles').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('status, responsible')
    ]);

    const bookingsByStatus: Record<string, number> = {
      [BookingStatus.PENDING]: 0,
      [BookingStatus.CONFIRMED]: 0,
      [BookingStatus.CANCELLED]: 0,
      [BookingStatus.EXPIRED]: 0,
      [BookingStatus.VISIT]: 0,
    };

    const bookingsByResponsible: Record<string, number> = {};

    const bookings = bookingsData as Booking[] || [];
    bookings.forEach(b => {
      if (b.status in bookingsByStatus) {
        bookingsByStatus[b.status]++;
      }
      if (b.responsible) {
        bookingsByResponsible[b.responsible] = (bookingsByResponsible[b.responsible] || 0) + 1;
      }
    });

    return {
      totalCustomers: customersCount || 0,
      totalSpaces: spacesCount || 0,
      totalResponsibles: responsiblesCount || 0,
      totalBookings: bookings.length,
      bookingsByStatus: bookingsByStatus as Record<BookingStatus, number>,
      bookingsByResponsible,
    };
  }
};
