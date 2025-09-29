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
