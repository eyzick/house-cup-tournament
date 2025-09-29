import { createClient } from '@supabase/supabase-js';

// These will be provided after you create your Supabase project
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'your-supabase-url';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database types for TypeScript (single row format)
export interface SupabaseHouseData {
  id: number;
  gryffindor: number;
  slytherin: number;
  hufflepuff: number;
  ravenclaw: number;
  transactions: Array<{
    id: string | number;
    house: string;
    points: number;
    reason: string;
    timestamp: string | number;
  }>;
  last_updated: string;
}
