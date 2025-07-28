import React, { useState, useEffect } from 'react';
import { getRules, saveRule } from '../database';
import './Rules.css';

const Rules = ({ onBack }) => {
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const rulesData = await getRules();
      setRules(rulesData);
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.trim()) return;

    try {
      setSaving(true);
      await saveRule(newRule.trim());
      setNewRule('');
      await loadRules(); // Reload rules
    } catch (error) {
      console.error('Error saving rule:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddRule();
    }
  };

  return (
    <div className="rules">
      <div className="rules-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h1>Game Rules</h1>
      </div>

      <div className="rules-content">
        <div className="add-rule-section">
          <h3>Add New Rule</h3>
          <div className="rule-input-container">
            <textarea
              className="rule-input"
              placeholder="Enter a new rule..."
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={3}
            />
            <button 
              className="add-rule-button"
              onClick={handleAddRule}
              disabled={!newRule.trim() || saving}
            >
              {saving ? 'Adding...' : 'Add Rule'}
            </button>
          </div>
        </div>

        <div className="rules-list-section">
          <h3>Current Rules</h3>
          
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading rules...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h4>No rules added yet</h4>
              <p>Add some rules to get started!</p>
            </div>
          ) : (
            <div className="rules-list">
              {rules.map((rule) => (
                <div key={rule.id} className="rule-item">
                  <div className="rule-content">
                    {rule.content}
                  </div>
                  <div className="rule-date">
                    Added {new Date(rule.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rules; 