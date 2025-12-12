# SQL Online IDE - Deployment Guide

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend       │────▶│   Firebase      │
│   (Next.js)     │     │   (FastAPI)     │     │   (Firestore)   │
│   Vercel/       │     │   Railway/      │     │   Google Cloud  │
│   Netlify       │     │   Render/       │     │                 │
│                 │     │   Fly.io        │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 🔐 Important: Secrets & Environment Variables

### Files to NEVER Commit (already in .gitignore)
- `firebase-credentials.json` - Backend service account key
- `.env.local` - Frontend Firebase config
- `.env` - Any environment files
- `temp_sessions/` - User session data

---

## 1️⃣ Firebase Setup (Required First)

### A. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project: "sql-online-ide"
3. Enable **Google Analytics** (optional)

### B. Enable Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable:
   - ✅ Email/Password
   - ✅ Google (add your production domain to authorized domains)

### C. Enable Firestore Database
1. Go to **Firestore Database** → **Create database**
2. Choose **Production mode**
3. Select region closest to your users (e.g., `us-central1`)

### D. Firestore Security Rules
Go to **Firestore** → **Rules** and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User sessions - only accessible by the server (admin SDK)
    match /user_sessions/{sessionId} {
      allow read, write: if false; // Server-only via Admin SDK
    }
    
    // User tables - only accessible by the server
    match /user_tables/{tableId} {
      allow read, write: if false; // Server-only via Admin SDK
    }
    
    // User queries - only accessible by the server
    match /user_queries/{userId} {
      allow read, write: if false; // Server-only via Admin SDK
    }
  }
}
```

### E. Get Firebase Credentials

#### For Frontend (.env.local):
1. Go to **Project Settings** → **General** → **Your apps**
2. Click **Add app** → **Web** (</> icon)
3. Register app and copy the config

#### For Backend (firebase-credentials.json):
1. Go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Save as `firebase-credentials.json` in `backend/` folder

---

## 2️⃣ Frontend Deployment (Vercel - Recommended)

### A. Prepare Environment Variables

Create these in Vercel dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://your-backend.railway.app/api` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth Domain | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID | `your-project-id` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage Bucket | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID | `1:123:web:abc` |

### B. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend
cd nextjs-frontend

# Deploy
vercel

# For production
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

### C. Update Firebase Authorized Domains
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your Vercel domain: `your-app.vercel.app`

---

## 3️⃣ Backend Deployment

### Option A: Railway (Recommended - Easiest)

1. **Create Account**: [railway.app](https://railway.app)

2. **Create New Project** → **Deploy from GitHub repo**

3. **Set Root Directory**: `backend`

4. **Add Environment Variables**:
   ```
   PORT=8000
   GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-credentials.json
   ```

5. **Add Firebase Credentials as Secret File**:
   - In Railway, go to your service → Variables
   - Add `FIREBASE_CREDENTIALS` with the JSON content
   - Create a `Dockerfile` or use the start command to write it to file

6. **Configure Start Command**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

### Option B: Render

1. **Create Account**: [render.com](https://render.com)

2. **New Web Service** → Connect your repo

3. **Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Add Environment Variables** (same as Railway)

5. **Add Secret File** for `firebase-credentials.json`

### Option C: Fly.io

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create `fly.toml`** in `backend/`:
   ```toml
   app = "sql-online-ide-backend"
   primary_region = "iad"

   [build]
     builder = "paketobuildpacks/builder:base"

   [env]
     PORT = "8080"

   [http_service]
     internal_port = 8080
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true

   [[vm]]
     cpu_kind = "shared"
     cpus = 1
     memory_mb = 512
   ```

3. **Deploy**:
   ```bash
   cd backend
   fly launch
   fly secrets set FIREBASE_CREDENTIALS="$(cat firebase-credentials.json)"
   fly deploy
   ```

---

## 4️⃣ Backend Dockerfile (For Container Deployments)

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create temp directory for sessions
RUN mkdir -p temp_sessions

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 5️⃣ CORS Configuration

Update `backend/main.py` for production:

```python
# Replace localhost origins with your production domains
origins = [
    "http://localhost:3000",  # Local dev
    "https://your-app.vercel.app",  # Production frontend
    "https://your-custom-domain.com",  # Custom domain
]
```

---

## 6️⃣ Production Checklist

### Security
- [ ] Firebase credentials are NOT in git
- [ ] `.env.local` is NOT in git
- [ ] CORS origins are restricted to your domains
- [ ] Firestore security rules are set to server-only
- [ ] Rate limiting is enabled (60 queries/minute)
- [ ] All dangerous SQL operations are blocked

### Performance
- [ ] DuckDB memory limit is set (`512MB` per session)
- [ ] Session cleanup is scheduled (expired sessions removed)
- [ ] Firestore data compression is enabled
- [ ] Max table data size limit (500KB compressed)

### Reliability
- [ ] Backend has health check endpoint (`/health`)
- [ ] Session data persists across restarts (Firestore sync)
- [ ] Error handling is in place

### Monitoring (Optional but Recommended)
- [ ] Set up logging (Vercel/Railway have built-in logs)
- [ ] Set up error tracking (Sentry)
- [ ] Set up uptime monitoring (UptimeRobot, Betterstack)

---

## 7️⃣ Domain Setup (Optional)

### Custom Domain for Frontend (Vercel)
1. Go to Vercel Dashboard → Your Project → Domains
2. Add your domain (e.g., `sqlide.yourdomain.com`)
3. Update DNS records as instructed

### Custom Domain for Backend (Railway/Render)
1. Go to your service → Settings → Domains
2. Add custom domain
3. Update DNS records

### Update CORS and Firebase
- Add new domain to `main.py` CORS origins
- Add new domain to Firebase authorized domains

---

## 8️⃣ Environment Variables Summary

### Frontend (.env.local / Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
```

### Backend (Railway/Render/Fly.io)
```env
PORT=8000

# CORS - Add your frontend domains (comma-separated)
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com

# Firebase credentials - path to JSON file
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-credentials.json

# OR provide the JSON content directly (some platforms support this):
FIREBASE_CREDENTIALS={"type":"service_account",...}
```

---

## 9️⃣ Estimated Costs

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Vercel** (Frontend) | 100GB bandwidth/mo | $20/mo Pro |
| **Railway** (Backend) | $5 free credit/mo | ~$5-10/mo |
| **Render** (Backend) | 750 hrs/mo (spins down) | $7/mo (always on) |
| **Fly.io** (Backend) | 3 shared VMs free | ~$5/mo |
| **Firebase** | 50K reads, 20K writes/day | Pay-as-you-go |

**Estimated Total**: Free to ~$15/month for small-medium usage

---

## 🚀 Quick Deploy Commands

```bash
# 1. Build frontend for production
cd nextjs-frontend
npm run build

# 2. Deploy frontend to Vercel
vercel --prod

# 3. Deploy backend to Railway
cd ../backend
railway up

# OR deploy to Render via GitHub

# OR deploy to Fly.io
fly deploy
```

---

## 🔧 Troubleshooting

### "Firebase credentials not found"
- Ensure `firebase-credentials.json` is in the `backend/` directory
- Or set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

### "CORS error"
- Add your frontend domain to the CORS origins in `main.py`
- Redeploy backend

### "Session not found"
- Sessions are stored on the backend server
- If backend restarts, sessions restore from Firestore for logged-in users
- Guest sessions may be lost on server restart

### "Rate limit exceeded"
- Wait 1 minute for counter to reset
- Current limit: 60 queries/minute

---

---

## 🔍 SEO & Getting Organic Traffic

### SEO Features Already Implemented

Your app includes:
- ✅ **Meta tags** (title, description, keywords)
- ✅ **Open Graph tags** (for social sharing)
- ✅ **Twitter Cards** (for Twitter sharing)
- ✅ **JSON-LD structured data** (for rich snippets)
- ✅ **Sitemap** (`/sitemap.xml` - auto-generated)
- ✅ **Robots.txt** (`/robots.txt` - auto-generated)
- ✅ **Semantic HTML** structure

### Steps to Get Organic Traffic

#### 1. Submit to Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property (domain or URL prefix)
3. Verify ownership (Vercel makes this easy)
4. Submit your sitemap: `https://your-domain.com/sitemap.xml`

#### 2. Set Your Site URL
Add to your Vercel environment variables:
```
NEXT_PUBLIC_SITE_URL=https://your-actual-domain.com
```

#### 3. Create an OG Image
Create `/public/og-image.png` (1200x630px) for social sharing.

#### 4. Add Google Analytics (Optional)
```bash
npm install @next/third-parties
```

Add to your layout:
```tsx
import { GoogleAnalytics } from '@next/third-parties/google'
// Add <GoogleAnalytics gaId="G-XXXXXXX" /> in <head>
```

### Traffic Growth Strategies

| Strategy | Effort | Impact | Timeline |
|----------|--------|--------|----------|
| **Google Search Console** | Low | High | 1-4 weeks |
| **Product Hunt Launch** | Medium | High | Immediate |
| **Reddit (r/SQL, r/learnSQL)** | Low | Medium | Immediate |
| **Dev.to / Hashnode Article** | Medium | Medium | 1-2 weeks |
| **Twitter/X Tech Community** | Low | Medium | Ongoing |
| **Hacker News** | Low | High (if it hits) | Immediate |
| **YouTube Tutorial** | High | High | 1-4 weeks |

### Custom Domain vs Vercel Subdomain

| Aspect | Vercel Subdomain | Custom Domain |
|--------|------------------|---------------|
| Cost | Free | ~$10-15/year |
| SEO Ranking | Limited | Full potential |
| Brand Trust | Lower | Higher |
| Recommendation | For testing | For production |

**Get a domain from**: Namecheap, Cloudflare, Porkbun, or Google Domains.

---

## 📞 Support

If you encounter issues:
1. Check the backend logs (Railway/Render dashboard)
2. Check the browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure Firebase project is properly configured

