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

// Costume voting database types
export interface SupabaseCostumeEntry {
  id: number;
  name: string;
  image_url: string;
  uploaded_at: string;
  created_by: string;
}

export interface SupabaseCostumeVote {
  id: number;
  voter_id: string;
  first_choice: number | null;
  second_choice: number | null;
  third_choice: number | null;
  voted_at: string;
}

export interface SupabaseCostumeResult {
  costume_id: number;
  costume_name: string;
  costume_image_url: string;
  first_place_votes: number;
  second_place_votes: number;
  third_place_votes: number;
  total_points: number;
}