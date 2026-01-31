# 🚀 Deploy in 5 Minutes - Railway.app

## Why Railway?
- ✅ **FREE**: $5 credit every month (enough for this app)
- ✅ **NO TIMEOUT LIMITS**: Unlike Vercel's 10-second limit
- ✅ **8GB RAM**: More than enough for PPT processing
- ✅ **AUTO SSL**: Automatic HTTPS certificates
- ✅ **AUTO DEPLOY**: Pushes to GitHub auto-deploy
- ✅ **EASY SETUP**: Literally 5 minutes

---

## Step-by-Step Guide

### 1. Go to Railway.app
👉 https://railway.app

### 2. Sign Up
- Click **"Login"** 
- Choose **"Login with GitHub"**
- Authorize Railway

### 3. Create New Project
- Click **"New Project"**
- Select **"Deploy from GitHub repo"**
- Find and select: `harshithkgowda/0G-Cluter-AI`

### 4. Add Environment Variables
Railway will start building. While it builds:

1. Click on your service (the deployed app)
2. Go to **"Variables"** tab
3. Click **"Add Variable"** and add these **ONE BY ONE**:

```
OPENROUTER_API_KEY
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

PIXABAY_API_KEY
52589174-34b492089fe2dee32626389f6

ZEROG_PRIVATE_KEY
2cf9ab6e720b45758a277d2211105392243e30a773edcdf727c3d19ccc81d3eb

NEXT_PUBLIC_SITE_URL
${{RAILWAY_PUBLIC_DOMAIN}}
```

**Important**: For `NEXT_PUBLIC_SITE_URL`, click the dropdown and select **"Reference"** → **"RAILWAY_PUBLIC_DOMAIN"**

### 5. Redeploy
- Click **"Deploy"** button
- Wait 2-3 minutes for build to complete

### 6. Get Your URL
- Once deployed, you'll see a **"Settings"** tab
- Go to **"Networking"**
- Click **"Generate Domain"**
- Copy your app URL: `https://your-app-name.railway.app`

---

## ✅ Test Your Deployment

1. Visit your Railway URL
2. Upload a PowerPoint template
3. Enter a topic (e.g., "AI in Healthcare")
4. Click "Generate PPT"
5. Wait 30-60 seconds
6. Download your AI-generated presentation!

---

## 💰 Cost

**FREE TIER:**
- $5 credit/month
- ~100 hours of runtime
- More than enough for personal/demo use

**If you need more:**
- Pay-as-you-go: ~$0.000463/min
- ~$20/month for constant uptime

---

## 🔧 Troubleshooting

### Build Failed?
- Check the build logs in Railway
- Make sure all environment variables are set
- Try redeploying

### App Not Working?
1. Check **"Logs"** tab in Railway
2. Look for error messages
3. Verify all environment variables are correct

### Need to Update Code?
- Just push to GitHub
- Railway will auto-deploy!

---

## 🆚 Comparison with Other Options

| Platform | Free Tier | Timeout | Memory | Setup Time | Cost/Month |
|----------|-----------|---------|--------|------------|------------|
| **Railway** | ✅ $5 credit | ✅ None | 8GB | 5 min | $0-5 |
| Vercel | ✅ Yes | ❌ 10s | 1GB | 3 min | $0-20 |
| Render | ✅ Yes | ⚠️ 15 min | 512MB | 10 min | $0-7 |
| DigitalOcean | ❌ No | ✅ None | 512MB | 15 min | $5 |

**Winner: Railway.app** 🏆

---

## 📱 Mobile App?

Once deployed on Railway, you can:
- Use it on any device via the web
- Add to home screen (PWA)
- Share the link with others

---

## 🎉 Done!

Your AI PPT Generator is now live and running on Railway!

Share your deployment: `https://your-app-name.railway.app`

Need help? Check [DEPLOYMENT.md](./DEPLOYMENT.md) for more options.
