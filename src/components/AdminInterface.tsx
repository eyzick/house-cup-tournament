import React, { useState, useEffect } from 'react';
import { PlusIcon, MinusIcon, UpdateIcon, StarIcon, Cross2Icon, ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { HOUSE_NAMES, HOUSE_COLORS, HouseData, StoredHouseData, PointTransaction, GameAction } from '../types';
import { addPoints, removePoints, resetAllPoints, fetchHouseData, isSupabaseConfigured, subscribeToUpdates } from '../services/supabaseService';
import styles from './AdminInterface.module.css';

interface AdminInterfaceProps {
  onClose: () => void;
}

interface PointInput {
  house: keyof HouseData;
  points: string;
  reason: string;
}


const QuickPointButtons = [
  { label: '+100', points: 100 },
  { label: '+50', points: 50 },
  { label: '+25', points: 25 },
  { label: '+10', points: 10 },
  { label: '-10', points: -10 },
  { label: '-25', points: -25 },
  { label: '-50', points: -50 },
  { label: '-100', points: -100 }
];

const GameActions: GameAction[] = [
  { key: 'beer_pong_win', label: 'Beer Pong Win', points: 50, reason: 'Beer Pong win' },
  { key: 'stack_cup_loss', label: 'Stack Cup Loss', points: -50, reason: 'Stack Cup loss' }
];

const AdminInterface: React.FC<AdminInterfaceProps> = ({ onClose }) => {
  const [houseData, setHouseData] = useState<StoredHouseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [inputData, setInputData] = useState<PointInput>({
    house: 'gryffindor',
    points: '',
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const unsubscribe = subscribeToUpdates((data) => {
      setHouseData(data);
    });

    return () => {
      try {
        unsubscribe && unsubscribe();
      } catch (e) {
        // noop
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchHouseData();
      setHouseData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoints = async (points: number, reason?: string) => {
    if (!isSupabaseConfigured()) {
      setError('JSONBin API not configured');
      return;
    }

    try {
      setIsProcessing(`Adding ${points} points to ${HOUSE_NAMES[inputData.house]}`);
      await addPoints(inputData.house, points, reason || inputData.reason || 'Manual entry');
      await loadData();
      setIsProcessing(null);
      
      if (!reason) {
        setInputData(prev => ({ ...prev, points: '', reason: '' }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add points');
      setIsProcessing(null);
    }
  };

  const handleRemovePoints = async (points: number) => {
    if (!isSupabaseConfigured()) {
      setError('JSONBin API not configured');
      return;
    }

    try {
      setIsProcessing(`Removing ${points} points from ${HOUSE_NAMES[inputData.house]}`);
      await removePoints(inputData.house, points, inputData.reason || 'Point deduction');
      await loadData();
      setIsProcessing(null);
      setInputData(prev => ({ ...prev, points: '', reason: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove points');
      setIsProcessing(null);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all house points to zero? This action cannot be undone.')) {
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('JSONBin API not configured');
      return;
    }

    try {
      setIsProcessing('Resetting all house points');
      await resetAllPoints();
      await loadData();
      setIsProcessing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset points');
      setIsProcessing(null);
    }
  };

  const handleQuickPoints = (points: number) => {
    handleAddPoints(points, `Quick ${points > 0 ? 'bonus' : 'deduction'}`);
  };

  const handleGameAction = async (action: GameAction) => {
    if (!isSupabaseConfigured()) {
      setError('JSONBin API not configured');
      return;
    }

    try {
      setIsProcessing(`${action.points >= 0 ? 'Applying' : 'Applying'} ${action.label} for ${HOUSE_NAMES[inputData.house]}`);
      if (action.points >= 0) {
        await addPoints(inputData.house, action.points, action.reason);
      } else {
        await removePoints(inputData.house, Math.abs(action.points), action.reason);
      }
      await loadData();
      setIsProcessing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply game action');
      setIsProcessing(null);
    }
  };

  const formatTransactionHistory = (transactions: PointTransaction[]) => {
    if (!transactions || transactions.length === 0) {
      return <p className={styles['no-transactions']}>No transactions yet.</p>;
    }

    // Sort transactions by timestamp (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => b.timestamp - a.timestamp);

    return (
      <div className={styles['transaction-list']}>
        {sortedTransactions.slice(0, 20).map((transaction) => (
          <div 
            key={transaction.id}
            className={styles['transaction-item']}
            style={{ '--house-color': HOUSE_COLORS[transaction.house] } as React.CSSProperties}
          >
            <div className={styles['transaction-header']}>
              <span className={styles['transaction-house']}>
                {HOUSE_NAMES[transaction.house]}
              </span>
              <span className={`${styles['transaction-points']} ${transaction.points > 0 ? styles['positive'] : styles['negative']}`}>
                {transaction.points > 0 ? '+' : ''}{transaction.points}
              </span>
            </div>
            <div className={styles['transaction-details']}>
              <span className={styles['transaction-reason']}>{transaction.reason}</span>
              <span className={styles['transaction-time']}>
                {new Date(transaction.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
        {sortedTransactions.length > 20 && (
          <div className={styles['more-transactions']}>
            Showing latest 20 transactions ({sortedTransactions.length} total)
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles['admin-overlay']}>
        <div className={styles['admin-content']}>
          <div className={styles['loading-state']}>
            <div className={styles.spinner}></div>
            <p>Loading admin data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className={styles['admin-overlay']}>
        <div className={styles['admin-content']}>
          <div className={styles['error-state']}>
            <h3>⚠️ Supabase Configuration Required</h3>
            <p>Please configure your Supabase credentials to use the admin features.</p>
            <p>Set the following environment variables:</p>
            <ul>
              <li><code>REACT_APP_SUPABASE_URL</code></li>
              <li><code>REACT_APP_SUPABASE_ANON_KEY</code></li>
            </ul>
            <button className={styles['close-button']} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['admin-overlay']}>
      <div className={styles['admin-content']}>
        <div className={styles['admin-header']}>
          <div className={styles['header-left']}>
            <StarIcon className={styles['header-icon']} />
            <h2>House Cup Admin</h2>
          </div>
          <button className={styles['close-button']} onClick={onClose}>
            <Cross2Icon />
          </button>
        </div>

        <div className={styles['admin-body']}>
          <div className={styles['house-selector']}>
            <label htmlFor="house-select">Select House:</label>
            <select 
              id="house-select"
              value={inputData.house}
              onChange={(e) => setInputData(prev => ({ 
                ...prev, 
                house: e.target.value as keyof HouseData 
              }))}
            >
              {Object.entries(HOUSE_NAMES).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles['quick-actions']}>
            <h3>Quick Actions</h3>
            <div className={styles['quick-buttons']}>
              {QuickPointButtons.map(({ label, points }) => (
                <button
                  key={label}
                  className={styles['quick-btn']}
                  data-negative={points < 0 ? "true" : "false"}
                  onClick={() => handleQuickPoints(points)}
                  disabled={!!isProcessing}
                  title={points > 0 ? `Add ${points} points` : `Subtract ${Math.abs(points)} points`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

        <div className={styles['quick-actions']}>
          <h3>Game Actions</h3>
          <div className={styles['quick-buttons']}>
            {GameActions.map((action) => (
              <button
                key={action.key}
                className={styles['quick-btn']}
                data-negative={action.points < 0 ? "true" : "false"}
                onClick={() => handleGameAction(action)}
                disabled={!!isProcessing}
                title={`${action.label} (${action.points > 0 ? '+' : ''}${action.points})`}
              >
                {action.label} ({action.points > 0 ? '+' : ''}{action.points})
              </button>
            ))}
          </div>
        </div>

          <div className={styles['manual-input']}>
            <h3>Manual Point Entry</h3>
            
            <div className={styles['input-group']}>
              <label htmlFor="points-input">Points:</label>
              <input
                id="points-input"
                type="number"
                placeholder="Enter points..."
                value={inputData.points}
                onChange={(e) => setInputData(prev => ({ ...prev, points: e.target.value }))}
              />
            </div>

            <div className={styles['input-group']}>
              <label htmlFor="reason-input">Reason (optional):</label>
              <input
                id="reason-input"
                type="text"
                placeholder="e.gr., 'Great costume!' or 'Rule breaking'..."
                value={inputData.reason}
                onChange={(e) => setInputData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>

            <div className={styles['action-buttons']}>
              <button
                className={styles['add-btn']}
                onClick={() => handleAddPoints(parseInt(inputData.points) || 0)}
                disabled={!inputData.points || !!isProcessing}
              >
                <PlusIcon />
                Add Points
              </button>
              <button
                className={styles['remove-btn']}
                onClick={() => handleRemovePoints(parseInt(inputData.points) || 0)}
                disabled={!inputData.points || !!isProcessing}
              >
                <MinusIcon />
                Remove Points
              </button>
            </div>
          </div>

          {error && (
            <div className={styles['error-message']}>
              ❌ {error}
            </div>
          )}

          {isProcessing && (
            <div className={styles['processing-message']}>
              ⏳ {isProcessing}
            </div>
          )}

          <div className={styles['history-section']}>
            <div 
              className={styles['history-header']}
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
            >
              <h3>📜 Transaction History ({houseData?.transactions?.length || 0})</h3>
              {isHistoryExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </div>
            
            {isHistoryExpanded && (
              <div className={styles['history-content']}>
                {houseData ? formatTransactionHistory(houseData.transactions) : 
                  <p className={styles['no-transactions']}>Loading history...</p>}
              </div>
            )}
          </div>

          <div className={styles['current-scores']}>
            <h3>Current Scores</h3>
            <div className={styles['scores-grid']}>
              {houseData && Object.entries(houseData.houses).map(([house, points]) => (
                <div 
                  key={house}
                  className={styles['score-card']}
                  style={{ '--house-color': HOUSE_COLORS[house as keyof HouseData] } as React.CSSProperties}
                >
                  <span className={styles['house-emblem']}>{house.charAt(0).toUpperCase()}</span>
                  <span className={styles['house-name']}>{HOUSE_NAMES[house as keyof HouseData]}</span>
                  <span className={styles.points}>{points}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles['danger-zone']}>
            <h3>⚠️ Danger Zone</h3>
            <p className={styles['danger-warning']}>This action will reset all house points to zero and cannot be undone.</p>
            <button 
              className={styles['reset-btn']}
              onClick={handleReset}
              disabled={!!isProcessing}
            >
              <UpdateIcon />
              Reset All Points
            </button>
          </div>

          <div className={styles['last-update']}>
            Last updated: {houseData ? new Date(houseData.lastUpdated).toLocaleString() : 'Never'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInterface;
