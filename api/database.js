import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.VITE_DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, data } = req.body;

  try {
    switch (action) {
      case 'getCurrentScores':
        const result = await sql`
          SELECT cameron_score, arun_score, current_round 
          FROM current_game 
          WHERE id = 1
        `;
        
        if (result.length > 0) {
          res.json({
            cameronScore: result[0].cameron_score,
            arunScore: result[0].arun_score,
            currentRound: result[0].current_round
          });
        } else {
          res.json({ cameronScore: 0, arunScore: 0, currentRound: 1 });
        }
        break;

      case 'saveCurrentScores':
        const { cameronScore, arunScore, currentRound } = data;
        await sql`DELETE FROM current_game WHERE id = 1`;
        await sql`
          INSERT INTO current_game (id, cameron_score, arun_score, current_round, updated_at)
          VALUES (1, ${cameronScore}, ${arunScore}, ${currentRound}, NOW())
        `;
        res.json({ success: true });
        break;

      case 'getWinCounts':
        const winResult = await sql`
          SELECT cameron_wins, arun_wins 
          FROM win_counts 
          WHERE id = 1
        `;
        
        if (winResult.length > 0) {
          res.json({
            cameronWins: winResult[0].cameron_wins,
            arunWins: winResult[0].arun_wins
          });
        } else {
          res.json({ cameronWins: 0, arunWins: 0 });
        }
        break;

      case 'saveWinCounts':
        const { cameronWins, arunWins } = data;
        await sql`DELETE FROM win_counts WHERE id = 1`;
        await sql`
          INSERT INTO win_counts (id, cameron_wins, arun_wins, updated_at)
          VALUES (1, ${cameronWins}, ${arunWins}, NOW())
        `;
        res.json({ success: true });
        break;

      case 'saveRound':
        const { cameronScore: roundCameronScore, arunScore: roundArunScore, winner } = data;
        await sql`
          INSERT INTO rounds (cameron_score, arun_score, winner, end_date)
          VALUES (${roundCameronScore}, ${roundArunScore}, ${winner}, NOW())
        `;
        res.json({ success: true });
        break;

      case 'getRounds':
        const roundsResult = await sql`
          SELECT * FROM rounds 
          ORDER BY end_date DESC
        `;
        res.json(roundsResult);
        break;

      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database operation failed' });
  }
} 