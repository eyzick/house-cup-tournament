import React, { useState, useEffect } from 'react';
import { PlusIcon, MinusIcon, UpdateIcon, StarIcon, Cross2Icon, ChevronDownIcon, ChevronRightIcon, UploadIcon, TrashIcon } from '@radix-ui/react-icons';
import { HOUSE_NAMES, HOUSE_COLORS, HouseData, StoredHouseData, PointTransaction, GameAction, CostumeEntry, CostumeResult, VotingSettings } from '../types';
import { addPoints, removePoints, resetAllPoints, fetchHouseData, isSupabaseConfigured, subscribeToUpdates } from '../services/supabaseService';
import { addCostumeEntry, getCostumeEntries, deleteCostumeEntry, getCostumeResults, getTotalVoteCount, getVotingSettings, updateVotingSettings } from '../services/costumeService';
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
  { key: 'beer_pong_loss', label: 'Beer Pong Loss', points: -25, reason: 'Beer Pong loss' },
  { key: 'stack_cup_loss', label: 'Stack Cup Loss', points: -50, reason: 'Stack Cup loss' },
  { key: 'spilled_drink', label: 'Spilled Drink', points: -20, reason: 'Spilled drink' },
  { key: 'take_out_trash', label: 'Take Out Trash', points: 10, reason: 'Take out trash' },
  { key: 'shotgun_drink', label: 'Shotgun Drink', points: 10, reason: 'Shotgun drink' },
  { key: 'take_shot', label: 'Take Shot', points: 10, reason: 'Take shot' },
  { key: 'take_jello_shot', label: 'Take Jello Shot', points: 5, reason: 'Take jello shot' },
  { key: 'break_lego_set', label: 'Break Lego Set', points: -1000, reason: 'Break Lego set' },
  { key: 'take_dog_out', label: 'Play fetch wtih Liana', points: 20, reason: 'Play fetch wtih Liana'},
  { key: 'win_chess_game', label: 'Win Chess Game', points: 30, reason: 'Win chess game' },
  { key: 'lose_chess_game', label: 'Lose Chess Game', points: -15, reason: 'Lose chess game' },
  { key: 'best_costume', label: 'Best Costume', points: 100, reason: 'Best costume' },
  { key: 'flip_cup_win', label: 'Flip Cup Win', points: 50, reason: 'Flip Cup win' },
  { key: 'flip_cup_loss', label: 'Flip Cup Loss', points: -25, reason: 'Flip Cup loss' },
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

  // Costume voting state
  const [costumeEntries, setCostumeEntries] = useState<CostumeEntry[]>([]);
  const [costumeResults, setCostumeResults] = useState<CostumeResult[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [costumeName, setCostumeName] = useState('');
  const [costumeImage, setCostumeImage] = useState<File | null>(null);
  const [votingSettings, setVotingSettings] = useState<VotingSettings>({ voting_enabled: false, last_updated: '' });

  // Tab state
  const [activeTab, setActiveTab] = useState<'points' | 'costumes'>('points');

  useEffect(() => {
    loadData();
    loadCostumeData();
  }, []);

  const loadCostumeData = async () => {
    try {
      const [entries, results, voteCount, settings] = await Promise.all([
        getCostumeEntries(),
        getCostumeResults(),
        getTotalVoteCount(),
        getVotingSettings()
      ]);
      setCostumeEntries(entries);
      setCostumeResults(results);
      setTotalVotes(voteCount);
      setVotingSettings(settings);
    } catch (err) {
      console.error('Failed to load costume data:', err);
    }
  };

  const handleCostumeUpload = async () => {
    if (!costumeName.trim() || !costumeImage) {
      setError('Please provide both a name and image for the costume entry');
      return;
    }

    try {
      setIsProcessing('Uploading costume entry...');
      await addCostumeEntry(costumeName.trim(), costumeImage);
      setCostumeName('');
      setCostumeImage(null);
      await loadCostumeData();
      setIsProcessing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload costume');
      setIsProcessing(null);
    }
  };

  const handleDeleteCostume = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this costume entry?')) {
      return;
    }

    try {
      setIsProcessing('Deleting costume entry...');
      await deleteCostumeEntry(id);
      await loadCostumeData();
      setIsProcessing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete costume');
      setIsProcessing(null);
    }
  };

  const handleToggleVoting = async () => {
    try {
      setIsProcessing('Updating voting settings...');
      const newEnabled = !votingSettings.voting_enabled;
      await updateVotingSettings(newEnabled);
      setVotingSettings(prev => ({ ...prev, voting_enabled: newEnabled }));
      setIsProcessing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update voting settings');
      setIsProcessing(null);
    }
  };


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
          {/* Tab Navigation */}
          <div className={styles['tab-navigation']}>
            <button
              className={`${styles['tab-button']} ${activeTab === 'points' ? styles['active'] : ''}`}
              onClick={() => setActiveTab('points')}
            >
              <StarIcon className={styles['tab-icon']} />
              Points Management
            </button>
            <button
              className={`${styles['tab-button']} ${activeTab === 'costumes' ? styles['active'] : ''}`}
              onClick={() => setActiveTab('costumes')}
            >
              <UploadIcon className={styles['tab-icon']} />
              Costume Contest
            </button>
          </div>

          {/* Points Tab Content */}
          {activeTab === 'points' && (
            <div className={styles['tab-content']}>
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
            </div>
          )}

          {/* Costume Tab Content */}
          {activeTab === 'costumes' && (
            <div className={styles['tab-content']}>
              <div className={styles['voting-control']}>
                <div className={styles['voting-toggle']}>
                  <h3>Voting Control</h3>
                  <div className={styles['toggle-container']}>
                    <label className={styles['toggle-label']}>
                      <input
                        type="checkbox"
                        checked={votingSettings.voting_enabled}
                        onChange={handleToggleVoting}
                        disabled={!!isProcessing}
                        className={styles['toggle-input']}
                      />
                      <span className={styles['toggle-slider']}></span>
                      <span className={styles['toggle-text']}>
                        {votingSettings.voting_enabled ? 'Voting Open' : 'Voting Closed'}
                      </span>
                    </label>
                  </div>
                  <p className={styles['voting-status']}>
                    {votingSettings.voting_enabled 
                      ? '✅ People can now vote on costumes' 
                      : '🔒 Voting is disabled - upload all costumes first'
                    }
                  </p>
                </div>
              </div>

              <div className={styles['costume-upload']}>
                <div className={styles['costume-header']}>
                  <h3>Add New Costume Entry</h3>
                </div>
                <div className={styles['input-group']}>
                  <label htmlFor="costume-name">Costume Name:</label>
                  <input
                    id="costume-name"
                    type="text"
                    placeholder="Enter costume name..."
                    value={costumeName}
                    onChange={(e) => setCostumeName(e.target.value)}
                  />
                </div>
                <div className={styles['input-group']}>
                  <label htmlFor="costume-image">Costume Image:</label>
                  <div className={styles['file-input-container']}>
                    <input
                      id="costume-image"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => setCostumeImage(e.target.files?.[0] || null)}
                      className={styles['file-input']}
                    />
                    <label htmlFor="costume-image" className={styles['file-input-label']}>
                      <UploadIcon className={styles['upload-icon']} />
                      {costumeImage ? (
                        <span>📷 {costumeImage.name}</span>
                      ) : (
                        <span>📷 Choose Photo or Take Picture</span>
                      )}
                    </label>
                  </div>
                  <div className={styles['camera-hint']}>
                    📱 On mobile: Tap above to take a photo directly with your camera
                  </div>
                </div>
                <button
                  className={styles['add-btn']}
                  onClick={handleCostumeUpload}
                  disabled={!costumeName.trim() || !costumeImage || !!isProcessing}
                >
                  <UploadIcon />
                  Upload Costume
                </button>
              </div>

              <div className={styles['costume-entries']}>
                <h3>Current Entries ({costumeEntries.length})</h3>
                {costumeEntries.length === 0 ? (
                  <p className={styles['no-entries']}>No costume entries yet.</p>
                ) : (
                  <div className={styles['entries-grid']}>
                    {costumeEntries.map((entry) => (
                      <div key={entry.id} className={styles['costume-card']}>
                        <img 
                          src={entry.image_url} 
                          alt={entry.name}
                          className={styles['costume-image']}
                        />
                        <div className={styles['costume-info']}>
                          <h5>{entry.name}</h5>
                          <p>Uploaded: {new Date(entry.uploaded_at).toLocaleDateString()}</p>
                          <button
                            className={styles['delete-btn']}
                            onClick={() => handleDeleteCostume(entry.id)}
                            disabled={!!isProcessing}
                          >
                            <TrashIcon />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles['leaderboard-section']}>
                <h3>🏆 Costume Contest Leaderboard ({totalVotes} votes)</h3>
                <div className={styles['leaderboard-content']}>
                  {costumeResults.length === 0 ? (
                    <p className={styles['no-results']}>No votes yet.</p>
                  ) : (
                    <div className={styles['results-list']}>
                      {costumeResults.map((result, index) => (
                        <div key={result.costume_id} className={styles['result-card']}>
                          <div className={styles['result-rank']}>
                            #{index + 1}
                          </div>
                          <img 
                            src={result.costume_image_url} 
                            alt={result.costume_name}
                            className={styles['result-image']}
                          />
                          <div className={styles['result-info']}>
                            <h4>{result.costume_name}</h4>
                            <div className={styles['result-stats']}>
                              <span>🥇 {result.first_place_votes} first</span>
                              <span>🥈 {result.second_place_votes} second</span>
                              <span>🥉 {result.third_place_votes} third</span>
                              <span className={styles['total-points']}>
                                Total: {result.total_points} pts
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
