export interface HouseData {
  gryffindor: number;
  slytherin: number;
  hufflepuff: number;
  ravenclaw: number;
}

export interface HouseScore {
  house: keyof HouseData;
  points: number;
}

export interface PointTransaction {
  id: string;
  house: keyof HouseData;
  points: number;
  reason: string;
  timestamp: number;
}

export interface StoredHouseData {
  houses: HouseData;
  transactions: PointTransaction[];
  lastUpdated: number;
}

export interface GameAction {
  key: string;    
  label: string; 
  points: number; 
  reason: string; 
}

export const HOUSE_COLORS = {
  gryffindor: '#740001',
  slytherin: '#1e4d13',
  hufflepuff: '#ecb939',
  ravenclaw: '#6d1bd9'
} as const;

export const HOUSE_NAMES = {
  gryffindor: 'Gryffindor',
  slytherin: 'Slytherin', 
  hufflepuff: 'Hufflepuff',
  ravenclaw: 'Ravenclaw'
} as const;

export const HOUSE_CRESTS = {
  gryffindor: `${process.env.PUBLIC_URL}/gryffindor.png`,
  slytherin: `${process.env.PUBLIC_URL}/slythern.png`,
  hufflepuff: `${process.env.PUBLIC_URL}/hufflepuff.png`,
  ravenclaw: `${process.env.PUBLIC_URL}/ravenclaw.png`
} as const;

// Costume voting types
export interface CostumeEntry {
  id: number;
  name: string;
  image_url: string;
  uploaded_at: string;
  created_by: string;
}

export interface CostumeVote {
  id: number;
  voter_id: string;
  first_choice: number | null;
  second_choice: number | null;
  third_choice: number | null;
  voted_at: string;
}

export interface CostumeResult {
  costume_id: number;
  costume_name: string;
  costume_image_url: string;
  first_place_votes: number;
  second_place_votes: number;
  third_place_votes: number;
  total_points: number;
}

export interface VoteSubmission {
  first_choice: number | null;
  second_choice: number | null;
  third_choice: number | null;
}

export interface VotingSettings {
  voting_enabled: boolean;
  last_updated: string;
}