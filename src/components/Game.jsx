import React, { useState, useEffect } from 'react';
import { saveRound, saveCurrentScores, getCurrentScores, saveWinCounts, getWinCounts } from '../database';
import { format } from 'date-fns';
import './Game.css';

const Game = ({ currentRound, roundStartTime, onNewRound, onViewHistory, onViewRules, onRoundCompleted }) => {
  const [cameronScore, setCameronScore] = useState(0);
  const [arunScore, setArunScore] = useState(0);
  const [cameronWins, setCameronWins] = useState(0);
  const [arunWins, setArunWins] = useState(0);
  const [gameStatus, setGameStatus] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const TARGET_SCORE = 50;

  // Load saved scores on component mount
  useEffect(() => {
    const loadScores = async () => {
      try {
        console.log('Loading scores from database...');
        const { cameronScore: savedCameronScore, arunScore: savedArunScore } = await getCurrentScores();
        const { cameronWins: savedCameronWins, arunWins: savedArunWins } = await getWinCounts();
        
        console.log('Loaded scores:', { savedCameronScore, savedArunScore, savedCameronWins, savedArunWins });
        console.log('Using round from App:', currentRound);
        
        setCameronScore(savedCameronScore);
        setArunScore(savedArunScore);
        setCameronWins(savedCameronWins);
        setArunWins(savedArunWins);
        
        // Don't override the round number from App - use it as the single source of truth
      } catch (error) {
        console.error('Error loading scores:', error);
      }
    };
    
    loadScores();
  }, []);

  useEffect(() => {
    checkGameStatus();
  }, [cameronScore, arunScore]);

  // Poll for score updates from other devices
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const { cameronScore: savedCameronScore, arunScore: savedArunScore } = await getCurrentScores();
        const { cameronWins: savedCameronWins, arunWins: savedArunWins } = await getWinCounts();
        
        console.log('Polling - Current scores:', { cameronScore, arunScore });
        console.log('Polling - Database scores:', { savedCameronScore, savedArunScore });
        console.log('Polling - Using round from App:', currentRound);
        
        // Only update if the scores are different (to avoid unnecessary re-renders)
        if (savedCameronScore !== cameronScore) {
          console.log('Updating Cameron score from', cameronScore, 'to', savedCameronScore);
          setCameronScore(savedCameronScore);
        }
        if (savedArunScore !== arunScore) {
          console.log('Updating Arun score from', arunScore, 'to', savedArunScore);
          setArunScore(savedArunScore);
        }
        if (savedCameronWins !== cameronWins) {
          console.log('Updating Cameron wins from', cameronWins, 'to', savedCameronWins);
          setCameronWins(savedCameronWins);
        }
        if (savedArunWins !== arunWins) {
          console.log('Updating Arun wins from', arunWins, 'to', savedArunWins);
          setArunWins(savedArunWins);
        }
        // Don't override the round number from App - use it as the single source of truth
      } catch (error) {
        console.error('Error polling for updates:', error);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(pollInterval);
  }, [cameronScore, arunScore, cameronWins, arunWins, currentRound]);

  const checkGameStatus = () => {
    if (!gameWon && cameronScore >= TARGET_SCORE) {
      setGameStatus('Cameron wins!');
      setGameWon(true);
      setShowCelebration(true);
      handleRoundEnd('Cameron');
    } else if (!gameWon && arunScore >= TARGET_SCORE) {
      setGameStatus('Arun wins!');
      setGameWon(true);
      setShowCelebration(true);
      handleRoundEnd('Arun');
    } else if (cameronScore === arunScore && cameronScore > 0 && !gameWon) {
      setGameStatus("It's a tie!");
    } else if (!gameWon) {
      setGameStatus('');
    }
  };

  const handleRoundEnd = async (winner) => {
    try {
      await saveRound(cameronScore, arunScore, winner);
      
      if (winner === 'Cameron') {
        const newWins = cameronWins + 1;
        setCameronWins(newWins);
        await saveWinCounts(newWins, arunWins);
      } else {
        const newWins = arunWins + 1;
        setArunWins(newWins);
        await saveWinCounts(cameronWins, newWins);
      }
      
      // Notify parent that a round was completed
      if (onRoundCompleted) {
        onRoundCompleted();
      }
    } catch (error) {
      console.error('Error saving round:', error);
    }
  };

  const adjustScore = async (player, amount) => {
    // Don't allow score changes if game is won
    if (gameWon) return;
    
    console.log('adjustScore called with:', { player, amount, currentCameronScore: cameronScore, currentArunScore: arunScore });
    
    if (player === 'cameron') {
      const newScore = Math.max(0, cameronScore + amount);
      console.log('Saving Cameron score:', newScore);
      setCameronScore(newScore);
      try {
        await saveCurrentScores(newScore, arunScore, currentRound);
        console.log('Successfully saved Cameron score to database');
      } catch (error) {
        console.error('Error saving Cameron score:', error);
      }
    } else {
      const newScore = Math.max(0, arunScore + amount);
      console.log('Saving Arun score:', newScore);
      setArunScore(newScore);
      try {
        await saveCurrentScores(cameronScore, newScore, currentRound);
        console.log('Successfully saved Arun score to database');
      } catch (error) {
        console.error('Error saving Arun score:', error);
      }
    }
  };

  const startNewRound = async () => {
    setCameronScore(0);
    setArunScore(0);
    setGameStatus('');
    setGameWon(false);
    setShowCelebration(false);
    await saveCurrentScores(0, 0, currentRound + 1);
    onNewRound();
  };

  return (
    <div className="game">
      {/* Header */}
      <div className="header">
        <div className="title">
          <span className="car-icon">🚗</span>
          Yellow Car
        </div>
        <div className="header-controls">
          <div className="round-info">
            <span className="round-badge">Round {currentRound}</span>
            <button 
              className="info-button"
              onClick={() => setShowInfo(!showInfo)}
            >
              ℹ️
            </button>
            <button className="reset-button" onClick={() => setShowResetModal(true)}>
              ⛔️
            </button>
          </div>
          <div className="target-info">Target {TARGET_SCORE}</div>
        </div>
      </div>

      {/* Game Status */}
      {gameStatus && (
        <div className="game-status">
          <span className="trophy-icon">🏆</span>
          {gameStatus}
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebration && (
        <div className="celebration-modal">
          <div className="celebration-content">
            <div className="celebration-icon">🎉</div>
            <h2 className="celebration-title">{gameStatus}</h2>
            <p className="celebration-subtitle">Congratulations! The round is complete.</p>
            <button className="new-round-button" onClick={startNewRound}>
              🚗 Start New Round
            </button>
          </div>
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div key={i} className="confetti" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}></div>
            ))}
          </div>
        </div>
      )}

      {/* Player Cards */}
      <div className="player-cards">
        {/* Cameron Card */}
        <div className="player-card">
          <div className="player-name">Cameron</div>
          <div className="wins-badge">Wins {cameronWins}</div>
          <div className="score-circle cameron-score">
            {cameronScore}
          </div>
          <div className="score-controls">
            <button 
              className="score-button minus"
              onClick={() => {
                console.log('Cameron minus button clicked');
                adjustScore('cameron', -1);
              }}
            >
              ➖
            </button>
            <button 
              className="score-button plus"
              onClick={() => {
                console.log('Cameron plus button clicked');
                adjustScore('cameron', 1);
              }}
            >
              ➕
            </button>
          </div>
        </div>

        {/* Arun Card */}
        <div className="player-card">
          <div className="player-name">Arun</div>
          <div className="wins-badge">Wins {arunWins}</div>
          <div className="score-circle arun-score">
            {arunScore}
          </div>
          <div className="score-controls">
            <button 
              className="score-button minus"
              onClick={() => {
                console.log('Arun minus button clicked');
                adjustScore('arun', -1);
              }}
            >
              ➖
            </button>
            <button 
              className="score-button plus"
              onClick={() => {
                console.log('Arun plus button clicked');
                adjustScore('arun', 1);
              }}
            >
              ➕
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bottom-controls">
        <button className="history-button" onClick={onViewHistory}>
          <span className="button-icon">📊</span>
          History
        </button>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="info-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Game Rules</h3>
              <button className="close-button" onClick={() => setShowInfo(false)}>✕</button>
            </div>
            
            <div className="rules-section yellow-car-rules">
              <h4>🚗 Yellow Car Rules</h4>
              <ul>
                <li>Must have valid driver's license</li>
                <li>Must be yellow in color</li>
                <li>No ambulances count</li>
                <li>Must be moving vehicle</li>
                <li>Can't reuse same car</li>
                <li>A false call is a FOUL and means losing a point</li>
              </ul>
            </div>
            
            <div className="rules-section scoring">
              <h4>🎯 Scoring</h4>
              <p>First player to reach {TARGET_SCORE} points wins the round!</p>
            </div>
          </div>
        </div>
      )}

      {/* Reset Modal */}
      {showResetModal && (
        <div className="info-modal">
          <div className="modal-content reset-modal">
            <div className="reset-icon">⛔️</div>
            <h3>Reset Round?</h3>
            <p>This will reset both players' scores to 0. This action cannot be undone.</p>
            <div className="modal-buttons">
              <button className="cancel-button" onClick={() => setShowResetModal(false)}>
                Cancel
              </button>
              <button className="reset-confirm-button" onClick={() => {
                startNewRound();
                setShowResetModal(false);
              }}>
                Reset Round
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game; 