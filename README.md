# Traitors Surprise

A Christmas gift interactive quiz for Eti and Jude themed around "The Traitors UK" series. This competitive quiz allows two players to answer questions simultaneously and see real-time leaderboard updates.

## Features

- **UK Traitors trivia questions** with varying difficulty levels
- **Two-player competitive mode** - Eti vs Jude
- **Randomized question order** - each player gets questions in a different order
- **Real-time leaderboard** - see who's winning as you play
- **Beautiful, dark-themed UI** with gold accents
- **Confetti animation** on voucher reveal
- **Backend score tracking** - scores sync between both players' devices

## Setup

### Install Dependencies

```bash
npm install
```

### Run the Server

```bash
npm start
```

The server will run on `http://localhost:3000` by default. You can change the port by setting the `PORT` environment variable.

### Access the Quiz

Open `http://localhost:3000` in two different browsers or devices (one for Eti, one for Jude).

Each player selects their identity when starting, and questions are randomized per player. The leaderboard updates every 2 seconds showing current scores.

## Project Structure

```
traitors-surprise/
├── server.js              # Express backend server
├── package.json           # Node.js dependencies
├── index.html             # Main quiz page
├── voucher.html           # Voucher reveal page
├── assets/
│   ├── css/
│   │   └── style.css      # All styles
│   └── js/
│       ├── app.js         # Main quiz logic
│       └── questions.js   # Question bank
└── README.md              # This file
```

## API Endpoints

- `GET /api/leaderboard` - Get current scores for both players
- `POST /api/answer` - Submit an answer (body: `{ player, correct, questionIndex }`)
- `POST /api/complete` - Mark a player as completed (body: `{ player }`)
- `POST /api/reset` - Reset game state (useful for testing)

## Deployment

For production deployment, you'll need a Node.js hosting service:

- **Heroku**: Deploy via Git
- **Railway**: Connect GitHub repo
- **Render**: Deploy from GitHub
- **Vercel**: Use serverless functions
- **DigitalOcean App Platform**: Deploy from GitHub

Make sure to set the server to listen on the port provided by your hosting service (usually via `process.env.PORT`).

## License

Private project - all rights reserved.
