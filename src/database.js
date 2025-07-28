import { neon } from '@neondatabase/serverless';

// You'll need to set these environment variables
let sql = null;

try {
  console.log('Environment check - DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('Environment check - import.meta.env.DATABASE_URL:', import.meta.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('Environment check - VITE_DATABASE_URL:', process.env.VITE_DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('Environment check - import.meta.env.VITE_DATABASE_URL:', import.meta.env.VITE_DATABASE_URL ? 'SET' : 'NOT SET');
  
  // Try both process.env and import.meta.env, and both variable names
  const databaseUrl = process.env.DATABASE_URL || import.meta.env.DATABASE_URL || 
                     process.env.VITE_DATABASE_URL || import.meta.env.VITE_DATABASE_URL;
  
  if (databaseUrl) {
    console.log('Initializing Neon database connection...');
    sql = neon(databaseUrl);
    console.log('Neon database connection initialized successfully');
  } else {
    console.warn('DATABASE_URL not set. Database features will be disabled.');
  }
} catch (error) {
  console.error('Failed to initialize database connection:', error);
}

export const initDatabase = async () => {
  if (!sql) {
    console.log('Database not configured. Using local storage fallback.');
    return;
  }
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS rounds (
        id SERIAL PRIMARY KEY,
        cameron_score INTEGER NOT NULL,
        arun_score INTEGER NOT NULL,
        winner VARCHAR(10) NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS rules (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS current_game (
        id INTEGER PRIMARY KEY,
        cameron_score INTEGER NOT NULL DEFAULT 0,
        arun_score INTEGER NOT NULL DEFAULT 0,
        current_round INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS win_counts (
        id INTEGER PRIMARY KEY,
        cameron_wins INTEGER NOT NULL DEFAULT 0,
        arun_wins INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

export const saveRound = async (cameronScore, arunScore, winner) => {
  if (!sql) {
    // Fallback to localStorage
    const rounds = JSON.parse(localStorage.getItem('yellowCarRounds') || '[]');
    const newRound = {
      id: Date.now(),
      cameron_score: cameronScore,
      arun_score: arunScore,
      winner: winner,
      end_date: new Date().toISOString()
    };
    rounds.unshift(newRound);
    localStorage.setItem('yellowCarRounds', JSON.stringify(rounds));
    return newRound;
  }
  
  try {
    const result = await sql`
      INSERT INTO rounds (cameron_score, arun_score, winner, end_date)
      VALUES (${cameronScore}, ${arunScore}, ${winner}, NOW())
      RETURNING *
    `;
    
    // Get the count of rounds to calculate the new round number
    const roundsCount = await sql`SELECT COUNT(*) as count FROM rounds`;
    const newRoundNumber = parseInt(roundsCount[0]?.count || 0) + 1;
    
    // Update the current_game table with the new round number
    await sql`DELETE FROM current_game WHERE id = 1`;
    await sql`
      INSERT INTO current_game (id, cameron_score, arun_score, current_round, updated_at)
      VALUES (1, 0, 0, ${newRoundNumber}, NOW())
    `;
    
    console.log('Round saved, updated current_game to round:', newRoundNumber);
    
    return result[0];
  } catch (error) {
    console.error('Error saving round:', error);
    throw error;
  }
};

export const getRounds = async () => {
  if (!sql) {
    // Fallback to localStorage
    const rounds = JSON.parse(localStorage.getItem('yellowCarRounds') || '[]');
    return rounds;
  }
  
  try {
    const result = await sql`
      SELECT * FROM rounds 
      ORDER BY end_date DESC
    `;
    return result;
  } catch (error) {
    console.error('Error fetching rounds:', error);
    return [];
  }
};

export const deleteRound = async (roundId) => {
  console.log('deleteRound called with ID:', roundId);
  
  if (!sql) {
    console.log('No database connection, using localStorage');
    // Fallback to localStorage
    const rounds = JSON.parse(localStorage.getItem('yellowCarRounds') || '[]');
    const updatedRounds = rounds.filter(round => round.id !== roundId);
    localStorage.setItem('yellowCarRounds', JSON.stringify(updatedRounds));
    console.log('Deleted from localStorage, remaining rounds:', updatedRounds.length);
    return true;
  }
  
  try {
    console.log('Deleting from database...');
    const result = await sql`DELETE FROM rounds WHERE id = ${roundId}`;
    console.log('Database delete result:', result);
    
    // Verify the deletion by checking remaining rounds
    const remainingRounds = await sql`SELECT COUNT(*) as count FROM rounds`;
    console.log('Remaining rounds in database:', remainingRounds[0]?.count);
    
    // Update the current_game table to reflect the new round number
    const newRoundNumber = parseInt(remainingRounds[0]?.count || 0) + 1;
    console.log('Updating current_game table to round:', newRoundNumber);
    
    // Delete existing current game record
    await sql`DELETE FROM current_game WHERE id = 1`;
    
    // Insert new current game record with updated round number
    await sql`
      INSERT INTO current_game (id, cameron_score, arun_score, current_round, updated_at)
      VALUES (1, 0, 0, ${newRoundNumber}, NOW())
    `;
    
    console.log('Successfully updated current_game table');
    
    return true;
  } catch (error) {
    console.error('Error deleting round:', error);
    return false;
  }
};

export const saveRule = async (content) => {
  if (!sql) {
    // Fallback to localStorage
    const rules = JSON.parse(localStorage.getItem('yellowCarRules') || '[]');
    const newRule = {
      id: Date.now(),
      content: content,
      created_at: new Date().toISOString()
    };
    rules.unshift(newRule);
    localStorage.setItem('yellowCarRules', JSON.stringify(rules));
    return newRule;
  }
  
  try {
    const result = await sql`
      INSERT INTO rules (content)
      VALUES (${content})
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Error saving rule:', error);
    throw error;
  }
};

export const getRules = async () => {
  if (!sql) {
    // Fallback to localStorage
    const rules = JSON.parse(localStorage.getItem('yellowCarRules') || '[]');
    return rules;
  }
  
  try {
    const result = await sql`
      SELECT * FROM rules 
      ORDER BY created_at DESC
    `;
    return result;
  } catch (error) {
    console.error('Error fetching rules:', error);
    return [];
  }
};

// New functions for real-time score synchronization
export const saveCurrentScores = async (cameronScore, arunScore, currentRound) => {
  console.log('saveCurrentScores called with:', { cameronScore, arunScore, currentRound });
  
  if (!sql) {
    console.log('No database connection, using localStorage');
    // Fallback to localStorage
    localStorage.setItem('yellowCarCameronScore', cameronScore.toString());
    localStorage.setItem('yellowCarArunScore', arunScore.toString());
    localStorage.setItem('yellowCarCurrentRound', currentRound.toString());
    return;
  }
  
  try {
    console.log('Saving to database...');
    console.log('SQL connection status:', sql ? 'CONNECTED' : 'NOT CONNECTED');
    
    // Delete existing current game record
    console.log('Deleting existing record...');
    const deleteResult = await sql`DELETE FROM current_game WHERE id = 1`;
    console.log('Delete result:', deleteResult);
    
    // Insert new current game record
    console.log('Inserting new record...');
    const insertResult = await sql`
      INSERT INTO current_game (id, cameron_score, arun_score, current_round, updated_at)
      VALUES (1, ${cameronScore}, ${arunScore}, ${currentRound}, NOW())
    `;
    console.log('Insert result:', insertResult);
    console.log('Successfully saved to database');
  } catch (error) {
    console.error('Error saving current scores:', error);
    throw error; // Re-throw so the calling function can catch it
  }
};

export const getCurrentScores = async () => {
  console.log('getCurrentScores called');
  
  if (!sql) {
    console.log('No database connection, using localStorage');
    // Fallback to localStorage
    const cameronScore = parseInt(localStorage.getItem('yellowCarCameronScore') || '0');
    const arunScore = parseInt(localStorage.getItem('yellowCarArunScore') || '0');
    console.log('localStorage scores:', { cameronScore, arunScore });
    return { cameronScore, arunScore };
  }
  
  try {
    console.log('Fetching from database...');
    // First check if the table exists
    const tableCheck = await sql`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'current_game'
    )`;
    console.log('Table exists check:', tableCheck);
    
    const result = await sql`
      SELECT cameron_score, arun_score 
      FROM current_game 
      WHERE id = 1
    `;
    
    console.log('Database result:', result);
    
    if (result.length > 0) {
      const scores = {
        cameronScore: result[0].cameron_score,
        arunScore: result[0].arun_score
      };
      console.log('Returning database scores:', scores);
      return scores;
    } else {
      console.log('No database record found, returning defaults');
      return { cameronScore: 0, arunScore: 0 };
    }
  } catch (error) {
    console.error('Error fetching current scores:', error);
    return { cameronScore: 0, arunScore: 0 };
  }
};

export const saveWinCounts = async (cameronWins, arunWins) => {
  if (!sql) {
    // Fallback to localStorage
    localStorage.setItem('yellowCarCameronWins', cameronWins.toString());
    localStorage.setItem('yellowCarArunWins', arunWins.toString());
    return;
  }
  
  try {
    // Delete existing win counts record
    await sql`DELETE FROM win_counts WHERE id = 1`;
    
    // Insert new win counts record
    await sql`
      INSERT INTO win_counts (id, cameron_wins, arun_wins, updated_at)
      VALUES (1, ${cameronWins}, ${arunWins}, NOW())
    `;
  } catch (error) {
    console.error('Error saving win counts:', error);
  }
};

export const getWinCounts = async () => {
  if (!sql) {
    // Fallback to localStorage
    const cameronWins = parseInt(localStorage.getItem('yellowCarCameronWins') || '0');
    const arunWins = parseInt(localStorage.getItem('yellowCarArunWins') || '0');
    return { cameronWins, arunWins };
  }
  
  try {
    // Calculate wins from actual rounds history instead of stored win_counts
    const rounds = await sql`
      SELECT winner 
      FROM rounds 
      ORDER BY end_date DESC
    `;
    
    let cameronWins = 0;
    let arunWins = 0;
    
    rounds.forEach(round => {
      if (round.winner === 'Cameron') {
        cameronWins++;
      } else if (round.winner === 'Arun') {
        arunWins++;
      }
    });
    
    console.log('Calculated wins from rounds history:', { cameronWins, arunWins });
    
    return { cameronWins, arunWins };
  } catch (error) {
    console.error('Error fetching win counts:', error);
    return { cameronWins: 0, arunWins: 0 };
  }
}; 