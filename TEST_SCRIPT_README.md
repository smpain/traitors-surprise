# Test Script for Simulating Multiple Players

## Overview

The `test-simulate-players.js` script simulates three players (Jude, Nathalie, Gareth) as if they were separate users accessing the game from different devices. This is useful for testing the game without using the built-in simulation feature.

## Usage

```bash
# Test against production Vercel deployment
node test-simulate-players.js https://traitors-surprise.vercel.app

# Test against local development server
node test-simulate-players.js http://localhost:3000
```

## How It Works

1. **Monitors Game Status**: Continuously polls `/api/game-status` every 2 seconds
2. **Detects New Questions**: When a new question appears, automatically simulates all three players answering
3. **Realistic Behavior**:
   - Staggers answers with 1-3 second delays
   - Mixes correct (70%) and incorrect (30%) answers
   - Answers are submitted via the `/api/answer` endpoint
4. **Continues Until Completion**: Runs until the game is completed

## Features

- ✅ Works against any deployment (local or production)
- ✅ Simulates realistic player behavior with delays
- ✅ Mixes correct and incorrect answers
- ✅ Handles errors gracefully
- ✅ Can be stopped with Ctrl+C

## Example Output

```
🎮 Starting player simulation against https://traitors-surprise.vercel.app
👥 Simulating players: Jude, Nathalie, Gareth

✓ Loaded 14 questions

🔄 New question detected: Question 1
📋 Simulating players for question 1...
✓ jude answered question 1 with answer 1 (correct: yes)
✓ nathalie answered question 1 with answer 0 (correct: no)
✓ gareth answered question 1 with answer 1 (correct: yes)
✓ All players simulated
```

## Notes

- The script requires Node.js and the `questions-data.js` file to be present
- Make sure the target URL is accessible and the API endpoints are working
- The script will continue running until the game completes or you stop it (Ctrl+C)
