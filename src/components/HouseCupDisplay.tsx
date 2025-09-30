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

const ScoreNumber: React.FC<{ value: number; duration?: number }> = ({ value, duration = 900 }) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [animating, setAnimating] = useState<boolean>(false);
  const fromRef = React.useRef<number>(value);
  const rafRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (value === fromRef.current) return;

    const startValue = fromRef.current;
    const endValue = value;
    const startTime = performance.now();
    setAnimating(true);

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const current = Math.round(startValue + (endValue - startValue) * eased);
      setDisplayValue(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = endValue;
        setAnimating(false);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <span className={`${styles['points-number']} ${animating ? styles['points-animating'] : ''}`}>{displayValue}</span>
  );
};

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
        <ScoreNumber value={points} />
        <span className={styles['points-label']}>points</span>
      </div>
      {isLeading && (
        <>
          <div className={styles['crown-container']}>
            <div className={styles.crown}>👑</div>
          </div>
          <div className={styles['sparkles']}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i}></span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const HouseCupDisplay: React.FC<HouseCupDisplayProps> = ({ autoRefresh = true }) => {
  const [houseData, setHouseData] = useState<StoredHouseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await fetchHouseData();
        
        setHouseData(data);
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
    });

    const pollInterval = setInterval(async () => {
      try {
        const data = await fetchHouseData();
        setHouseData(data);
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
      <div className={styles['twinkling-stars']} aria-hidden>
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i}></span>
        ))}
      </div>
      <div className={styles['cup-header']}>
        <div className={styles['main-crest-container']}>
          <img src={`${process.env.PUBLIC_URL}/house-crest.png`} alt="Hogwarts Crest" className={styles['main-crest']} />
        </div>
        <h1 className={styles['cup-title']}>🏆 House Cup Tournament 🏆</h1>
        <div className={styles['cup-subtitle']}>Live Scoring</div>
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
        </div>
      </div>
    </div>
  );
};

export default HouseCupDisplay;
