import { supabase, SupabaseHouseData } from '../supabase/client';
import { HouseData, StoredHouseData, PointTransaction } from '../types';

const DEFAULT_HOUSE_DATA: HouseData = {
  gryffindor: 0,
  slytherin: 0,
  hufflepuff: 0,
  ravenclaw: 0
};

function convertFromSupabase(data: SupabaseHouseData): StoredHouseData {
  return {
    houses: {
      gryffindor: data.gryffindor,
      slytherin: data.slytherin,
      hufflepuff: data.hufflepuff,
      ravenclaw: data.ravenclaw
    },
    transactions: data.transactions.map(t => ({
      id: typeof t.id === 'string' ? t.id : t.id.toString(),
      house: t.house as keyof HouseData,
      points: t.points,
      reason: t.reason,
      timestamp: typeof t.timestamp === 'string' ? new Date(t.timestamp).getTime() : t.timestamp
    })),
    lastUpdated: new Date(data.last_updated).getTime()
  };
}

function convertToSupabase(data: StoredHouseData): Partial<SupabaseHouseData> {
  return {
    gryffindor: data.houses.gryffindor,
    slytherin: data.houses.slytherin,
    hufflepuff: data.houses.hufflepuff,
    ravenclaw: data.houses.ravenclaw,
    transactions: data.transactions.map(t => ({
      id: typeof t.id === 'string' ? parseFloat(t.id) || Date.now() : t.timestamp,
      house: t.house,
      points: t.points,
      reason: t.reason,
      timestamp: t.timestamp
    })),
    last_updated: new Date(data.lastUpdated).toISOString()
  };
}

export async function fetchHouseData(): Promise<StoredHouseData> {
  try {
    const { data, error } = await supabase
      .from('house_points')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (!data) {
      await initializeHouseData();
      return { houses: DEFAULT_HOUSE_DATA, transactions: [], lastUpdated: Date.now() };
    }

    return convertFromSupabase(data);
  } catch (error) {
    console.error('Failed to fetch house data from Supabase:', error);
    throw error;
  }
}

async function initializeHouseData(): Promise<void> {
  try {
    const { error } = await supabase
      .from('house_points')
      .insert({
        id: 1,
        gryffindor: 0,
        slytherin: 0,
        hufflepuff: 0,
        ravenclaw: 0,
        transactions: [],
        last_updated: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Supabase initialization error: ${error.message}`);
    }
  } catch (error) {
    console.error('Failed to initialize house data:', error);
    throw error;
  }
}

export async function updateHouseData(data: StoredHouseData): Promise<boolean> {
  try {
    const supabaseData = convertToSupabase(data);
    
    const { error } = await supabase
      .from('house_points')
      .upsert({
        id: 1,
        ...supabaseData
      });

    if (error) {
      throw new Error(`Supabase update error: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Failed to update house data in Supabase:', error);
    throw error;
  }
}

export async function addPoints(house: keyof HouseData, points: number, reason: string): Promise<boolean> {
  try {
    const currentData = await fetchHouseData();
    
    const transaction: PointTransaction = {
      id: Date.now().toString(),
      house,
      points,
      reason,
      timestamp: Date.now()
    };

    const updatedData: StoredHouseData = {
      houses: {
        ...currentData.houses,
        [house]: currentData.houses[house] + points
      },
      transactions: [...currentData.transactions, transaction],
      lastUpdated: Date.now()
    };

    return await updateHouseData(updatedData);
  } catch (error) {
    console.error('Failed to add points:', error);
    throw error;
  }
}

export async function removePoints(house: keyof HouseData, points: number, reason: string): Promise<boolean> {
  try {
    const currentData = await fetchHouseData();
    
    const removalPoints = Math.max(0, currentData.houses[house] - points);
    const actualPointsRemoved = currentData.houses[house] - removalPoints;

    if (actualPointsRemoved === 0) {
      return true; // No points to remove
    }

    const transaction: PointTransaction = {
      id: Date.now().toString(),
      house,
      points: -actualPointsRemoved,
      reason,
      timestamp: Date.now()
    };

    const updatedData: StoredHouseData = {
      houses: {
        ...currentData.houses,
        [house]: removalPoints
      },
      transactions: [...currentData.transactions, transaction],
      lastUpdated: Date.now()
    };

    return await updateHouseData(updatedData);
  } catch (error) {
    console.error('Failed to remove points:', error);
    throw error;
  }
}

export async function resetAllPoints(): Promise<boolean> {
  try {
    const updatedData: StoredHouseData = {
      houses: { gryffindor: 0, slytherin: 0, hufflepuff: 0, ravenclaw: 0 },
      transactions: [],
      lastUpdated: Date.now()
    };

    return await updateHouseData(updatedData);
  } catch (error) {
    console.error('Failed to reset points:', error);
    throw error;
  }
}

export function subscribeToUpdates(callback: (data: StoredHouseData) => void) {
  const subscription = supabase
    .channel('house-cup-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'house_points',
        filter: 'id=eq.1'
      },
      async (payload) => {
        try {
          const data = await fetchHouseData();
          callback(data);
        } catch (error) {
          console.error('Failed to fetch updated data:', error);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
  return !!(url && key && url !== 'your-supabase-url' && key !== 'your-supabase-anon-key');
}
