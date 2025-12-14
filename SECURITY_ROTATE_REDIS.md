# Security: Rotate Redis Credentials

## Issue
The `.env.development.local` file containing Redis credentials was accidentally committed to git.

## Actions Taken
1. ✅ Removed `.env.development.local` from git history using `git filter-branch`
2. ✅ Added `.env.development.local` and `.env*.local` patterns to `.gitignore`
3. ✅ Force-pushed cleaned history to remote

## Next Steps: Rotate Redis Credentials

### 1. Rotate the Redis Key in Vercel KV

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Navigate to your project: `traitors-surprise`
3. Go to **Storage** → **KV** (or **Upstash Redis**)
4. Find your Redis database
5. Click **Settings** or **Manage**
6. Look for **"Rotate Token"** or **"Regenerate Token"** option
7. Generate a new REST API token
8. **Save the new token securely** (you'll need it)

### 2. Update Environment Variables in Vercel

1. In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Update `KV_REST_API_TOKEN` with the new token from step 1
3. Verify `KV_REST_API_URL` is still correct (usually doesn't change)
4. **Redeploy** your application for changes to take effect

### 3. Update Local Development (if needed)

If you have a local `.env.development.local` file:
1. Delete the old file
2. Create a new `.env.development.local` with:
   ```
   KV_REST_API_URL=<your-new-url>
   KV_REST_API_TOKEN=<your-new-token>
   ```
3. **DO NOT COMMIT THIS FILE** - it's now in `.gitignore`

### 4. Verify

After redeploying:
1. Check Vercel function logs for `[REDIS] Connected to Redis successfully`
2. Test the game to ensure Redis is working
3. Verify no errors in logs

## Important Notes

- The old credentials are still in git history (even though removed from current tree)
- Anyone who cloned the repo before this fix may have the old credentials
- Consider the old credentials compromised and rotate them immediately
- The force push rewrites history - anyone who cloned before needs to re-clone or reset

## Prevention

- ✅ `.env*.local` files are now in `.gitignore`
- Always check `git status` before committing
- Never commit files with secrets/credentials
- Use Vercel environment variables for production secrets
