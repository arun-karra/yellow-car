import { neon } from '@neondatabase/serverless';

// You'll need to set these environment variables
let sql = null;

try {
  if (process.env.VITE_DATABASE_URL) {
    sql = neon(process.env.VITE_DATABASE_URL);
  } else {
    console.warn('VITE_DATABASE_URL not set. Database features will be disabled.');
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