import React, { useState, useEffect } from 'react';
import { saveRound } from '../database';
import { format } from 'date-fns';
import './Game.css';

const Game = ({ currentRound, roundStartTime, onNewRound, onViewHistory, onViewRules }) => {
  const [cameronScore, setCameronScore] = useState(0);
  const [arunScore, setArunScore] = useState(0);
  const [cameronWins, setCameronWins] = useState(0);
  const [arunWins, setArunWins] = useState(0);
  const [gameStatus, setGameStatus] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const TARGET_SCORE = 50;

  // Load saved scores on component mount
  useEffect(() => {
    const savedCameronScore = localStorage.getItem('yellowCarCameronScore');
    const savedArunScore = localStorage.getItem('yellowCarArunScore');
    const savedCameronWins = localStorage.getItem('yellowCarCameronWins');
    const savedArunWins = localStorage.getItem('yellowCarArunWins');
    
    if (savedCameronScore) setCameronScore(parseInt(savedCameronScore));
    if (savedArunScore) setArunScore(parseInt(savedArunScore));
    if (savedCameronWins) setCameronWins(parseInt(savedCameronWins));
    if (savedArunWins) setArunWins(parseInt(savedArunWins));
  }, []);

  useEffect(() => {
    checkGameStatus();
  }, [cameronScore, arunScore]);

  const checkGameStatus = () => {
    if (cameronScore >= TARGET_SCORE) {
      setGameStatus('Cameron wins!');
      handleRoundEnd('Cameron');
    } else if (arunScore >= TARGET_SCORE) {
      setGameStatus('Arun wins!');
      handleRoundEnd('Arun');
    } else if (cameronScore === arunScore && cameronScore > 0) {
      setGameStatus("It's a tie!");
    } else {
      setGameStatus('');
    }
  };

  const handleRoundEnd = async (winner) => {
    try {
      await saveRound(cameronScore, arunScore, winner);
      
      if (winner === 'Cameron') {
        const newWins = cameronWins + 1;
        setCameronWins(newWins);
        localStorage.setItem('yellowCarCameronWins', newWins.toString());
      } else {
        const newWins = arunWins + 1;
        setArunWins(newWins);
        localStorage.setItem('yellowCarArunWins', newWins.toString());
      }
    } catch (error) {
      console.error('Error saving round:', error);
    }
  };

  const adjustScore = (player, amount) => {
    if (player === 'cameron') {
      const newScore = Math.max(0, cameronScore + amount);
      setCameronScore(newScore);
      localStorage.setItem('yellowCarCameronScore', newScore.toString());
    } else {
      const newScore = Math.max(0, arunScore + amount);
      setArunScore(newScore);
      localStorage.setItem('yellowCarArunScore', newScore.toString());
    }
  };

  const startNewRound = () => {
    setCameronScore(0);
    setArunScore(0);
    setGameStatus('');
    localStorage.removeItem('yellowCarCameronScore');
    localStorage.removeItem('yellowCarArunScore');
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
              onClick={() => adjustScore('cameron', -1)}
            >
              ➖
            </button>
            <button 
              className="score-button plus"
              onClick={() => adjustScore('cameron', 1)}
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
              onClick={() => adjustScore('arun', -1)}
            >
              ➖
            </button>
            <button 
              className="score-button plus"
              onClick={() => adjustScore('arun', 1)}
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