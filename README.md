# Yellow Car Game

A progressive web app (PWA) for a simple two-player scoring game, optimized for iPhone screens.

## Features

- **Two-Player Game**: Cameron vs Arun
- **Simple Scoring**: Use + and - buttons to adjust scores
- **Win Condition**: First player to reach 50 points wins the round
- **Game History**: View all previous rounds with dates and scores
- **Rules Management**: Add and view custom game rules
- **Persistent Storage**: All data stored in Neon database
- **PWA Support**: Install as a native app on iPhone
- **iPhone Optimized**: Designed specifically for iPhone screens

## Tech Stack

- **Frontend**: React 18 with Vite
- **Database**: Neon PostgreSQL
- **Styling**: CSS with iPhone-specific optimizations
- **PWA**: Service worker and manifest for app-like experience

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. Create a Neon database at [console.neon.tech](https://console.neon.tech)
2. Copy your connection string
3. Create a `.env` file in the root directory:

```bash
cp env.example .env
```

4. Add your Neon database URL to `.env`:

```
VITE_DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```

### 3. Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## iPhone Installation

1. Open the app in Safari on your iPhone
2. Tap the Share button (square with arrow)
3. Tap "Add to Home Screen"
4. The app will now appear as a native app

## Game Rules

- Each player starts with 0 points
- Use the + and - buttons to adjust scores
- First player to reach 50 points wins the round
- Rounds are automatically saved to the database
- View game history to see all previous rounds
- Add custom rules in the Rules section

## Database Schema

### Rounds Table
- `id`: Primary key
- `cameron_score`: Cameron's final score
- `arun_score`: Arun's final score
- `winner`: Winner name ('Cameron' or 'Arun')
- `start_date`: Round start timestamp
- `end_date`: Round end timestamp

### Rules Table
- `id`: Primary key
- `content`: Rule text
- `created_at`: Rule creation timestamp

## iPhone Optimizations

- Safe area handling for notched devices
- Touch-friendly button sizes (44px minimum)
- Portrait orientation lock
- PWA manifest for native app experience
- Optimized viewport settings
- Smooth animations and transitions

## Development Notes

- The app uses CSS custom properties for theming
- All database operations are async and handle errors gracefully
- The PWA service worker caches static assets
- iPhone-specific media queries ensure optimal display
- Database connection is established on app startup

## License

MIT License 