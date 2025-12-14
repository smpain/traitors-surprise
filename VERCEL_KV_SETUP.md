# Setting Up Vercel KV (Upstash Redis) for Game State Persistence

## Step 1: Create Upstash Redis Database in Vercel

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: `traitors-surprise`
3. Click on **"Storage"** or **"Marketplace"** in the left sidebar
4. Search for **"Upstash Redis"**
5. Click **"Add Integration"** or **"Create Database"**
6. Follow the prompts to create a new Upstash Redis database
7. Vercel will automatically add these environment variables to your project:
   - `KV_REST_API_URL` (primary - used by Vercel KV)
   - `KV_REST_API_TOKEN` (primary - used by Vercel KV)
   - Or alternatively: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (if set up directly)

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

- If you see `[REDIS] Redis credentials not found`, verify the environment variables are set in Vercel Dashboard → Settings → Environment Variables
- Vercel KV uses `KV_REST_API_URL` and `KV_REST_API_TOKEN` (not `UPSTASH_REDIS_REST_URL`)
- Make sure you've installed `@upstash/redis` in your `package.json`
- Check that your Vercel plan supports Upstash Redis (most plans do)
- After adding environment variables, you may need to redeploy for them to take effect
