# Setting Up Vercel KV (Upstash Redis) for Game State Persistence

## Step 1: Create Upstash Redis Database in Vercel

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: `traitors-surprise`
3. Click on **"Storage"** or **"Marketplace"** in the left sidebar
4. Search for **"Upstash Redis"**
5. Click **"Add Integration"** or **"Create Database"**
6. Follow the prompts to create a new Upstash Redis database
7. Vercel will automatically add these environment variables to your project:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## Step 2: Install Dependencies

Run this command locally:
```bash
npm install @upstash/redis
```

## Step 3: Deploy

After installing the package and setting up the database, push your code:
```bash
git add .
git commit -m "Add Upstash Redis for persistent game state"
git push
```

Vercel will automatically use the environment variables you set up in the dashboard.

## Step 4: Verify

Once deployed, check the Vercel function logs to see if Redis is connecting properly. You should see logs like:
- `[REDIS] Connected to Redis`
- `[REDIS] Loaded game state from Redis`

## Troubleshooting

- If you see connection errors, verify the environment variables are set in Vercel Dashboard → Settings → Environment Variables
- Make sure you've installed `@upstash/redis` in your `package.json`
- Check that your Vercel plan supports Upstash Redis (most plans do)
