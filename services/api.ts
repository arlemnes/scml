
import { supabaseService } from './supabaseService';
import { IApiService } from './types';

// In a real environment, this might check an env variable
// const useSupabase = process.env.VITE_USE_SUPABASE === 'true';

export const api: IApiService = supabaseService;
