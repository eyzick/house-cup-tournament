import React, { useState, useEffect } from 'react';
import { StarIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { CostumeEntry, VoteSubmission } from '../types';
import { getCostumeEntries, submitVote, hasUserVoted, getVotingSettings } from '../services/costumeService';
import styles from './CostumeVoting.module.css';

const CostumeVoting: React.FC = () => {
  const [costumeEntries, setCostumeEntries] = useState<CostumeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingEnabled, setVotingEnabled] = useState(false);
  const [vote, setVote] = useState<VoteSubmission>({
    first_choice: null,
    second_choice: null,
    third_choice: null
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [entries, voted, settings] = await Promise.all([
        getCostumeEntries(),
        hasUserVoted(),
        getVotingSettings()
      ]);
      setCostumeEntries(entries);
      setHasVoted(voted);
      setVotingEnabled(settings.voting_enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load costume entries');
    } finally {
      setLoading(false);
    }
  };

  const handleVoteSelection = (costumeId: number, position: 'first_choice' | 'second_choice' | 'third_choice') => {
    if (hasVoted || !votingEnabled) return;

    setVote(prev => {
      const newVote = { ...prev };
      
      // Clear any existing selection for this position
      if (newVote[position] === costumeId) {
        newVote[position] = null;
        return newVote;
      }
      
      // Clear this costume from other positions
      Object.keys(newVote).forEach(key => {
        if (newVote[key as keyof VoteSubmission] === costumeId) {
          newVote[key as keyof VoteSubmission] = null;
        }
      });
      
      // Set the new selection
      newVote[position] = costumeId;
      return newVote;
    });
  };

  const handleSubmitVote = async () => {
    if (hasVoted || !votingEnabled) return;

    const hasAnyVote = vote.first_choice || vote.second_choice || vote.third_choice;
    if (!hasAnyVote) {
      setError('Please select at least one costume to vote for');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await submitVote(vote);
      setHasVoted(true);
      setShowSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRankIcon = (position: 'first_choice' | 'second_choice' | 'third_choice') => {
    switch (position) {
      case 'first_choice': return '🥇';
      case 'second_choice': return '🥈';
      case 'third_choice': return '🥉';
      default: return '';
    }
  };

  const getRankLabel = (position: 'first_choice' | 'second_choice' | 'third_choice') => {
    switch (position) {
      case 'first_choice': return '1st Place';
      case 'second_choice': return '2nd Place';
      case 'third_choice': return '3rd Place';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading costume entries...</p>
        </div>
      </div>
    );
  }

  if (error && !showSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <Cross2Icon className={styles.errorIcon} />
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadData} className={styles.retryBtn}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.success}>
          <CheckIcon className={styles.successIcon} />
          <h2>Vote Submitted!</h2>
          <p>Thank you for voting in the costume contest!</p>
          <p className={styles.successNote}>
            Your vote has been recorded. Results will be announced at the end of the night.
          </p>
        </div>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className={styles.container}>
        <div className={styles.alreadyVoted}>
          <CheckIcon className={styles.votedIcon} />
          <h2>You've Already Voted!</h2>
          <p>Thank you for participating in the costume contest.</p>
          <p className={styles.votedNote}>
            Results will be announced at the end of the night.
          </p>
        </div>
      </div>
    );
  }

  if (!votingEnabled) {
    return (
      <div className={styles.container}>
        <div className={styles.votingDisabled}>
          <Cross2Icon className={styles.disabledIcon} />
          <h2>Voting Not Yet Open</h2>
          <p>Costume voting will begin once all entries are uploaded.</p>
          <p className={styles.disabledNote}>
            Check back later when voting opens!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StarIcon className={styles.headerIcon} />
        <h1>Costume Contest Voting</h1>
        <p>Rank your top 3 favorite costumes!</p>
      </div>

      {costumeEntries.length === 0 ? (
        <div className={styles.noEntries}>
          <p>No costume entries available yet.</p>
          <p>Check back later!</p>
        </div>
      ) : (
        <>
          <div className={styles.votingInstructions}>
            <h3>How to Vote:</h3>
            <ul>
              <li>Tap on a costume to select it for 1st, 2nd, or 3rd place</li>
              <li>You can change your selection by tapping again</li>
              <li>You don't need to vote for all three positions</li>
              <li>Submit your vote when you're ready!</li>
            </ul>
          </div>

          <div className={styles.costumesGrid}>
            {costumeEntries.map((costume) => (
              <div 
                key={costume.id} 
                className={`${styles.costumeCard} ${
                  vote.first_choice === costume.id ? styles.selectedFirst :
                  vote.second_choice === costume.id ? styles.selectedSecond :
                  vote.third_choice === costume.id ? styles.selectedThird : ''
                }`}
              >
                <div className={styles.costumeImageContainer}>
                  <img 
                    src={costume.image_url} 
                    alt={costume.name}
                    className={styles.costumeImage}
                  />
                  {(vote.first_choice === costume.id || 
                    vote.second_choice === costume.id || 
                    vote.third_choice === costume.id) && (
                    <div className={styles.rankBadge}>
                      {vote.first_choice === costume.id && '🥇'}
                      {vote.second_choice === costume.id && '🥈'}
                      {vote.third_choice === costume.id && '🥉'}
                    </div>
                  )}
                </div>
                
                <div className={styles.costumeInfo}>
                  <h3>{costume.name}</h3>
                </div>

                <div className={styles.voteButtons}>
                  {(['first_choice', 'second_choice', 'third_choice'] as const).map((position) => (
                    <button
                      key={position}
                      className={`${styles.voteBtn} ${
                        vote[position] === costume.id ? styles.active : ''
                      }`}
                      onClick={() => handleVoteSelection(costume.id, position)}
                    >
                      {getRankIcon(position)}
                      <span>{getRankLabel(position)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.submitSection}>
            <button
              className={styles.submitBtn}
              onClick={handleSubmitVote}
              disabled={isSubmitting || (!vote.first_choice && !vote.second_choice && !vote.third_choice)}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Vote'}
            </button>
          </div>
        </>
      )}

      {error && (
        <div className={styles.errorMessage}>
          ❌ {error}
        </div>
      )}
    </div>
  );
};

export default CostumeVoting;
