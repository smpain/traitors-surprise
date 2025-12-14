# Next.js Setup Complete

This project has been converted from Express to Next.js for better Vercel deployment.

## Structure

- `pages/` - Next.js pages and API routes
  - `pages/index.js` - Main game page
  - `pages/voucher.js` - Voucher reveal page
  - `pages/api/` - API endpoints (game-status, answer, next-question, etc.)
- `lib/gameState.js` - Shared game state module (works better than Express serverless)
- `public/assets/` - Static files (CSS, JS) - served automatically by Next.js
- `next.config.js` - Next.js configuration

## Running Locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## Building for Production

```bash
npm run build
npm start
```

## Deployment to Vercel

Just push to GitHub - Vercel will automatically detect Next.js and deploy it.

The game state is stored in memory in `lib/gameState.js`. This works better with Next.js API routes than Express serverless functions because:
- Next.js API routes can share modules more reliably
- State persists within the same serverless instance
- Better for small-scale multiplayer games

## Note on State Management

For a small game with 4 players, in-memory state works fine. If you need to scale to many concurrent games, consider adding Redis or a database later.
