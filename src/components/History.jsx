import React, { useState, useEffect } from 'react';
import { getRounds } from '../database';
import { format } from 'date-fns';
import './History.css';

const History = ({ onBack }) => {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRounds();
  }, []);

  const loadRounds = async () => {
    try {
      setLoading(true);
      const roundsData = await getRounds();
      setRounds(roundsData);
    } catch (error) {
      console.error('Error loading rounds:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Unknown date';
    }
  };

  const getWinnerClass = (winner) => {
    return winner === 'Cameron' ? 'cameron-winner' : 'arun-winner';
  };

  return (
    <div className="history">
      <div className="history-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Game History</h1>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading history...</p>
        </div>
      ) : rounds.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No games played yet</h3>
          <p>Start playing to see your history here!</p>
        </div>
      ) : (
        <div className="rounds-list">
          {rounds.map((round) => (
            <div key={round.id} className="round-item">
              <div className="round-header">
                <div className="round-date">
                  {formatDate(round.end_date)}
                </div>
                <div className={`winner-badge ${getWinnerClass(round.winner)}`}>
                  {round.winner} wins
                </div>
              </div>
              
              <div className="round-scores">
                <div className="score-item cameron">
                  <span className="player-label">Cameron</span>
                  <span className="score-value">{round.cameron_score}</span>
                </div>
                <div className="score-divider">vs</div>
                <div className="score-item arun">
                  <span className="player-label">Arun</span>
                  <span className="score-value">{round.arun_score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History; 