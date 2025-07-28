import React, { useState, useEffect } from 'react';
import Game from './components/Game';
import History from './components/History';
import Rules from './components/Rules';
import { initDatabase, getRounds } from './database';
import './App.css';

// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          color: 'white', 
          backgroundColor: '#1a1a1a',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <h1>Something went wrong</h1>
          <p>Please refresh the page to try again.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#22c55e',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [currentView, setCurrentView] = useState('game');
  const [currentRound, setCurrentRound] = useState(1);
  const [roundStartTime, setRoundStartTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [roundsHistory, setRoundsHistory] = useState([]);

  useEffect(() => {
    // Initialize database when app starts
    const initializeApp = async () => {
      try {
        await initDatabase();
        // Load rounds history to calculate current round
        const rounds = await getRounds();
        setRoundsHistory(rounds);
        // Set current round to history length + 1
        setCurrentRound(rounds.length + 1);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  const startNewRound = () => {
    setCurrentRound(prev => prev + 1);
    setRoundStartTime(new Date());
  };

  const updateRoundFromHistory = async () => {
    try {
      const rounds = await getRounds();
      setRoundsHistory(rounds);
      setCurrentRound(rounds.length + 1);
    } catch (error) {
      console.error('Error updating round from history:', error);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'history':
        return <History onBack={() => setCurrentView('game')} onRoundDeleted={updateRoundFromHistory} />;
      case 'rules':
        return <Rules onBack={() => setCurrentView('game')} />;
      default:
        return (
          <Game 
            currentRound={currentRound}
            roundStartTime={roundStartTime}
            onNewRound={startNewRound}
            onViewHistory={() => setCurrentView('history')}
            onViewRules={() => setCurrentView('rules')}
            onRoundCompleted={updateRoundFromHistory}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #2a2a2a',
          borderTop: '4px solid #22c55e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading Yellow Car Game...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        {renderView()}
      </div>
    </ErrorBoundary>
  );
}

export default App; 