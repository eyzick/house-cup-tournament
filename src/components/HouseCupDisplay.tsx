import React, { useState, useEffect } from 'react';
import { HouseData, HOUSE_COLORS, HOUSE_NAMES, StoredHouseData } from '../types';
import { fetchHouseData, subscribeToUpdates, isSupabaseConfigured } from '../services/supabaseService';
import styles from './HouseCupDisplay.module.css';

interface HouseCupDisplayProps {
  autoRefresh?: boolean;
}

interface HouseCardProps {
  house: keyof HouseData;
  points: number;
  position: number;
  isLeading?: boolean;
}

const HouseCard: React.FC<HouseCardProps> = ({ house, points, position, isLeading }) => {
  const color = HOUSE_COLORS[house];
  const name = HOUSE_NAMES[house];

  return (
    <div 
      className={`${styles['house-card']} ${isLeading ? styles.leading : ''}`}
      style={{ '--house-color': color } as React.CSSProperties}
    >
      <div className={styles['house-header']}>
        <span className={styles['position-number']}>{position}</span>
        <span className={styles['house-name']}>{name}</span>
      </div>
      <div className={styles['points-display']}>
        <span className={styles['points-number']}>{points}</span>
        <span className={styles['points-label']}>points</span>
      </div>
      {isLeading && (
        <div className={styles['crown-container']}>
          <div className={styles.crown}>👑</div>
        </div>
      )}
    </div>
  );
};

const HouseCupDisplay: React.FC<HouseCupDisplayProps> = ({ autoRefresh = true }) => {
  const [houseData, setHouseData] = useState<StoredHouseData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await fetchHouseData();
        
        setHouseData(data);
        setLastUpdated(new Date(data.lastUpdated));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load house data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh || !isSupabaseConfigured()) return;

    const unsubscribe = subscribeToUpdates((data) => {
      setHouseData(data);
      setLastUpdated(new Date(data.lastUpdated));
    });

    const pollInterval = setInterval(async () => {
      try {
        const data = await fetchHouseData();
        setHouseData(data);
        setLastUpdated(new Date(data.lastUpdated));
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [autoRefresh]);

  if (isLoading) {
    return (
      <div className={`${styles['house-cup-display']} ${styles.loading}`}>
        <div className={styles['loading-spinner']}></div>
        <p>Loading House Cup data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles['house-cup-display']} ${styles.error}`}>
        <div className={styles['error-icon']}>⚠️</div>
        <h3>Something went wrong!</h3>
        <p>{error}</p>
        <button 
          className={styles['retry-button']}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!houseData) {
    return (
      <div className={`${styles['house-cup-display']} ${styles.error}`}>
        <div className={styles['error-icon']}>❌</div>
        <h3>No data available</h3>
        <p>House Cup data couldn't be loaded.</p>
      </div>
    );
  }

  const houses = houseData.houses;
  const sortedHouses = Object.entries(houses)
    .sort(([, a], [, b]) => b - a)
    .map(([house, points], index) => ({
      house: house as keyof HouseData,
      points,
      position: index + 1
    }));

  const leadingPoints = Math.max(...Object.values(houses));
  const totalPoints = Object.values(houses).reduce((sum, points) => sum + points, 0);

  return (
    <div className={styles['house-cup-display']}>
      <div className={styles['cup-header']}>
        <div className={styles['main-crest-container']}>
          <img src={`${process.env.PUBLIC_URL}/house-crest.png`} alt="Hogwarts Crest" className={styles['main-crest']} />
        </div>
        <h1 className={styles['cup-title']}>🏆 House Cup Tournament 🏆</h1>
        <div className={styles['cup-subtitle']}>Live Scoring</div>
        {lastUpdated && (
          <div className={styles['last-updated']}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className={styles['houses-grid']}>
        {sortedHouses.map(({ house, points, position }) => (
          <HouseCard
            key={house}
            house={house}
            points={points}
            position={position}
            isLeading={points === leadingPoints && points > 0}
          />
        ))}
      </div>

      <div className={styles['cup-footer']}>
        <div className={styles['stats-summary']}>
          <div className={styles.stat}>
            <span className={styles['stat-label']}>Total Points:</span>
            <span className={styles['stat-value']}>{totalPoints}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles['stat-label']}>Leading House:</span>
            <span className={styles['stat-value']}>
              {leadingPoints > 0 ? HOUSE_NAMES[sortedHouses[0].house] : 'None'}
            </span>
          </div>
        </div>
        
        <div className={styles['live-indicator']}>
          <div className={styles['live-pulse']}></div>
          <span>Live Updates</span>
          <small>(Real-time + Auto-refresh)</small>
        </div>
      </div>
    </div>
  );
};

export default HouseCupDisplay;
