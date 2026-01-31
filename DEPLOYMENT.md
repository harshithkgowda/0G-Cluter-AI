# Alternative Deployment Options

## ⚠️ Vercel Issues & Solutions

If you're experiencing issues with Vercel, here are the common problems and multiple deployment alternatives:

### Common Vercel Issues:

1. **Timeout Issues**: PPT generation takes time (30-60 seconds)
2. **Memory Limits**: Processing large files requires more memory
3. **Cold Starts**: Serverless functions may timeout on first request
4. **Environment Variables**: Must be properly configured

---

## 🚀 Option 1: Fix Vercel Deployment (Recommended)

### Step 1: Configure Vercel Settings

1. Go to your project on Vercel: https://vercel.com/dashboard
2. Go to **Settings** → **Functions**
3. Set:
   - **Max Duration**: 300 seconds (5 minutes)
   - **Memory**: 3008 MB (maximum)

### Step 2: Add Environment Variables

Go to **Settings** → **Environment Variables** and add:

```bash
OPENROUTER_API_KEY=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
PIXABAY_API_KEY=52589174-34b492089fe2dee32626389f6
ZEROG_PRIVATE_KEY=2cf9ab6e720b45758a277d2211105392243e30a773edcdf727c3d19ccc81d3eb
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### Step 3: Update `vercel.json` (Already Added)

The `vercel.json` file has been added to increase function timeouts and memory.

### Step 4: Redeploy

```bash
git add .
git commit -m "Configure Vercel for increased timeouts and memory"
git push origin main
```

---

## 🐳 Option 2: Deploy with Docker (Self-Hosted)

### Create Dockerfile:

```dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]
```

### Deploy to:
- **DigitalOcean App Platform**: $5/month
- **Railway**: Free tier or $5/month
- **Render**: Free tier or $7/month
- **AWS Lightsail**: $3.50/month
- **Your own server**: Any VPS

### Docker Commands:

```bash
# Build image
docker build -t ai-ppt-generator .

# Run locally
docker run -p 3000:3000 --env-file .env.local ai-ppt-generator

# Or use docker-compose (see docker-compose.yml)
docker-compose up -d
```

---

## ☁️ Option 3: Deploy to Railway.app (Free Tier)

Railway offers generous free tier with no timeout limits!

### Steps:

1. Go to https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Connect your GitHub account
4. Select `harshithkgowda/0G-Cluter-AI`
5. Railway will auto-detect Next.js
6. Add environment variables in Railway dashboard:
   ```
   OPENROUTER_API_KEY=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
   PIXABAY_API_KEY=52589174-34b492089fe2dee32626389f6
   ZEROG_PRIVATE_KEY=2cf9ab6e720b45758a277d2211105392243e30a773edcdf727c3d19ccc81d3eb
   NEXT_PUBLIC_SITE_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   ```
7. Deploy!

**Advantages:**
- ✅ No timeout limits
- ✅ More memory (8GB)
- ✅ Free tier: $5 credit/month
- ✅ Auto SSL certificates
- ✅ Auto deployments from GitHub

---

## 🌐 Option 4: Deploy to Render.com (Free Tier)

### Steps:

1. Go to https://render.com
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repo: `harshithkgowda/0G-Cluter-AI`
4. Configure:
   - **Name**: ai-ppt-generator
   - **Environment**: Node
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm start`
5. Add environment variables (see above)
6. Deploy!

**Advantages:**
- ✅ Free tier available
- ✅ No cold starts
- ✅ Auto SSL
- ✅ Good performance

---

## 🔧 Option 5: Deploy to DigitalOcean App Platform

### Steps:

1. Go to https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Connect GitHub repo
4. Configure:
   - **Type**: Web Service
   - **Build Command**: `pnpm install && pnpm run build`
   - **Run Command**: `pnpm start`
5. Add environment variables
6. Choose plan: $5/month (512MB RAM)

**Advantages:**
- ✅ Reliable and fast
- ✅ No timeouts
- ✅ Better support
- ✅ $200 free credit for new users

---

## 🏠 Option 6: Self-Host with PM2

If you have a VPS or home server:

```bash
# Install PM2
npm install -g pm2

# Start the app
pm2 start npm --name "ai-ppt-generator" -- start

# Save PM2 configuration
pm2 save

# Auto-start on reboot
pm2 startup
```

---

## 🎯 Recommended Approach

### For Development/Testing:
**Railway.app** - Free, easy, no timeout limits

### For Production:
1. **Railway.app** (Free/$5/month) - Best for startups
2. **DigitalOcean** ($5/month) - Best for reliability
3. **Vercel** (Free tier) - If you fix the timeout issues

---

## 🔍 Troubleshooting Vercel

If you still want to use Vercel, check:

1. **Function Logs**: 
   - Go to Vercel Dashboard → Deployments → Function Logs
   - Look for timeout or memory errors

2. **Check Response Size**:
   - Large PPT files might exceed Vercel's 4.5MB response limit
   - Solution: Use 0G Storage to store files and return a download URL

3. **Upgrade Vercel Plan**:
   - Free tier: 10 second timeout, 1024MB memory
   - Pro tier ($20/month): 60 second timeout, 3008MB memory

---

## 📧 Need Help?

1. Check function logs in your deployment platform
2. Test locally first: `pnpm run dev`
3. Verify environment variables are set correctly
4. Check API key validity

**Quick Test:**
```bash
# Test API locally
curl -X POST http://localhost:3000/api/generate-ppt \
  -F "file=@template.pptx" \
  -F "prompt=AI in Healthcare" \
  -F "slideCount=5"
```
