import React, { useState, useEffect } from 'react';
import HouseCupDisplay from './components/HouseCupDisplay';
import AdminInterface from './components/AdminInterface';
import CostumeVoting from './components/CostumeVoting';
import styles from './App.module.css';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      setShowPasswordPrompt(true);
    }
  }, []);

  // Check if this is the voting page
  const isVotingPage = window.location.pathname === '/vote' || 
                      window.location.pathname === '/costume-vote' ||
                      window.location.search.includes('vote=true');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowPasswordPrompt(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePasswordSuccess = (enteredPassword: string) => {
    const adminPassword = process.env.REACT_APP_ADMIN_PASSWORD;
    if (enteredPassword === adminPassword) {
      setShowPasswordPrompt(false);
      setShowAdmin(true);
    } else {
      alert('Incorrect password!');
    }
  };

  const handleAdminClose = () => {
    setShowAdmin(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    window.history.replaceState({}, '', url.toString());
  };

  // If this is the voting page, show only the voting component
  if (isVotingPage) {
    return <CostumeVoting />;
  }

  return (
    <div className={styles.App}>
      <HouseCupDisplay autoRefresh={true} />
      
      <button 
        className={styles['admin-toggle-btn']}
        onClick={() => setShowPasswordPrompt(true)}
        title="Open Admin Panel (Ctrl+Shift+A)"
      >
        ⚙️
      </button>

      {showPasswordPrompt && (
        <div className={styles['password-overlay']}>
          <div className={styles['password-prompt']}>
            <h3>🔐 Admin Access</h3>
            <p>Enter password to access admin functions:</p>
            <div className={styles['password-input']}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSuccess(password)}
                placeholder="Password..."
                autoFocus
              />
              <button onClick={() => handlePasswordSuccess(password)}>
                Enter
              </button>
            </div>
            <button 
              className={styles['cancel-btn']}
              onClick={() => {
                setShowPasswordPrompt(false);
                setPassword('');
                const url = new URL(window.location.href);
                url.searchParams.delete('admin');
                window.history.replaceState({}, '', url.toString());
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showAdmin && <AdminInterface onClose={handleAdminClose} />}
    </div>
  );
}

export default App;
