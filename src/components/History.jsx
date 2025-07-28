import React, { useState, useEffect } from 'react';
import { getRounds, deleteRound } from '../database';
import { format } from 'date-fns';
import './History.css';

const History = ({ onBack, onRoundDeleted }) => {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roundToDelete, setRoundToDelete] = useState(null);

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

  const handleDeleteClick = (round) => {
    setRoundToDelete(round);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roundToDelete) return;
    
    try {
      console.log('Deleting round:', roundToDelete.id);
      const success = await deleteRound(roundToDelete.id);
      console.log('Delete success:', success);
      if (success) {
        // Remove the round from the local state
        const updatedRounds = rounds.filter(round => round.id !== roundToDelete.id);
        console.log('Updated rounds count:', updatedRounds.length);
        setRounds(updatedRounds);
        setShowDeleteModal(false);
        setRoundToDelete(null);
        // Notify parent component to update round counter
        if (onRoundDeleted) {
          console.log('Calling onRoundDeleted callback');
          onRoundDeleted();
        }
      } else {
        console.error('Failed to delete round');
      }
    } catch (error) {
      console.error('Error deleting round:', error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setRoundToDelete(null);
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
                <div className="round-actions">
                  <div className={`winner-badge ${getWinnerClass(round.winner)}`}>
                    {round.winner} wins
                  </div>
                  <button 
                    className="delete-button"
                    onClick={() => handleDeleteClick(round)}
                    title="Delete this round"
                  >
                    🗑️
                  </button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="delete-modal">
          <div className="delete-content">
            <div className="delete-icon">🗑️</div>
            <h3>Delete Round?</h3>
            <p>Are you sure you want to delete this round? This action cannot be undone.</p>
            <div className="delete-round-info">
              <div className="delete-round-scores">
                <span>Cameron: {roundToDelete?.cameron_score}</span>
                <span>vs</span>
                <span>Arun: {roundToDelete?.arun_score}</span>
              </div>
              <div className="delete-round-winner">
                Winner: {roundToDelete?.winner}
              </div>
              <div className="delete-round-date">
                {roundToDelete && formatDate(roundToDelete.end_date)}
              </div>
            </div>
            <div className="delete-buttons">
              <button className="cancel-delete-button" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button className="confirm-delete-button" onClick={handleDeleteConfirm}>
                Delete Round
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History; 