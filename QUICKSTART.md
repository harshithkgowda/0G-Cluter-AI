# 🚀 Quick Deploy Guide

Choose your preferred deployment method:

## 1️⃣ Railway.app (Easiest - 5 minutes) ⭐ RECOMMENDED

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

1. Click the Railway button above OR go to https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Connect to GitHub and select `harshithkgowda/0G-Cluter-AI`
4. Add environment variables in Railway dashboard:
   ```
   OPENROUTER_API_KEY=your_key_here
   PIXABAY_API_KEY=your_key_here
   ZEROG_PRIVATE_KEY=your_key_here
   NEXT_PUBLIC_SITE_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   ```
5. Click **Deploy** - Done! ✅

**Why Railway?**
- ✅ Free $5 credit/month
- ✅ No timeout limits
- ✅ 8GB RAM included
- ✅ Auto SSL
- ✅ Auto deployments from GitHub

---

## 2️⃣ Vercel (Fixed Configuration)

1. Go to https://vercel.com
2. Import your GitHub repo
3. Add environment variables:
   ```
   OPENROUTER_API_KEY=your_key_here
   PIXABAY_API_KEY=your_key_here
   ZEROG_PRIVATE_KEY=your_key_here
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   ```
4. Go to **Settings** → **Functions**:
   - Max Duration: 300 seconds
   - Memory: 3008 MB
5. Redeploy

**Note:** Requires Vercel Pro ($20/month) for longer timeouts.

---

## 3️⃣ Render.com

1. Go to https://render.com
2. New → **Web Service**
3. Connect GitHub repo
4. Configure:
   - Build: `pnpm install && pnpm run build`
   - Start: `pnpm start`
5. Add environment variables
6. Deploy

---

## 4️⃣ Docker (Self-Host)

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t ai-ppt-generator .
docker run -p 3000:3000 --env-file .env.local ai-ppt-generator
```

---

## 🔑 Environment Variables

Required for all deployment methods:

```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxx
PIXABAY_API_KEY=xxxxx
ZEROG_PRIVATE_KEY=xxxxx
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Get your keys:
- OpenRouter: https://openrouter.ai/keys
- Pixabay: https://pixabay.com/api/docs/
- 0G Network: Create a wallet and get private key

---

## ⚡ Local Development

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Add your API keys to .env.local

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

---

## 🐛 Troubleshooting

### Issue: Timeout on Vercel
**Solution:** Use Railway or upgrade to Vercel Pro

### Issue: PPT not downloading
**Solution:** Check browser console and API logs for errors

### Issue: 0G Storage not working
**Solution:** Verify ZEROG_PRIVATE_KEY and wallet has 0G tokens

### Issue: No images in slides
**Solution:** Verify PIXABAY_API_KEY is valid

---

## 📚 More Help

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment options and troubleshooting.
