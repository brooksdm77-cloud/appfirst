# 🚀 Deployment Guide - SmartGrocer NZ

This guide covers deploying SmartGrocer NZ to both Firebase Hosting and Cloudflare Pages for maximum flexibility.

## Prerequisites

- Node.js 16+ installed
- GitHub account (optional but recommended for CI/CD)
- Firebase account + project
- Cloudflare account

## Option 1: Firebase Hosting (Recommended for Backend)

Firebase is ideal if you plan to add backend features later (authentication, database, etc.).

### Setup Steps

#### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `smartgrocer-nz`
4. Enable Analytics (optional)
5. Create project

#### 2. Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### 3. Initialize Firebase

```bash
firebase login
firebase init hosting
```

When prompted:
- Select your project
- Public directory: `dist`
- Configure as single-page app: `Yes`

#### 4. Update `.firebaserc`

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

Replace `your-project-id` with your actual Firebase project ID.

#### 5. Deploy

```bash
npm run build
npm run deploy:firebase
```

Your app will be live at: `https://your-project-id.web.app`

---

## Option 2: Cloudflare Pages (Recommended for Static Content)

Cloudflare Pages is perfect for fast, globally distributed static sites with minimal setup.

### Setup Steps

#### 1. Prepare Repository

Push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/smartgrocer-nz.git
git push -u origin main
```

#### 2. Connect to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select "Pages" from sidebar
3. Click "Create a project"
4. Select "Connect to Git"
5. Authorize GitHub
6. Select your repository
7. Configure build:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version**: 18
8. Click "Save and Deploy"

#### 3. Custom Domain (Optional)

1. Go to Pages project settings
2. Click "Custom domains"
3. Add your domain
4. Follow DNS configuration instructions

Your app will be live at: `https://smartgrocer-nz.pages.dev`

---

## Option 3: Deploy to Both (Dual Setup)

For maximum flexibility, deploy to both platforms:

### Firebase Setup (same as Option 1)

```bash
npm run deploy:firebase
```

Result: `https://smartgrocer-nz.web.app`

### Cloudflare Setup (same as Option 2)

Push to GitHub and connect to Cloudflare Pages.

Result: `https://smartgrocer-nz.pages.dev`

---

## CI/CD Automation

### GitHub Actions for Firebase

Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_SMARTGROCER }}
          channelId: live
          projectId: your-project-id
```

#### Get Firebase Service Account

1. Go to Firebase Project Settings
2. Click "Service Accounts"
3. Click "Generate New Private Key"
4. In GitHub repo, go to Settings → Secrets
5. Create secret `FIREBASE_SERVICE_ACCOUNT_SMARTGROCER`
6. Paste the JSON content

### Cloudflare Pages (Automatic)

Cloudflare Pages automatically deploys on every push to your connected GitHub branch!

---

## Environment Variables

### Firebase

Create `.env.production` for Firebase deployments:

```env
VITE_APP_ENV=production
VITE_FIREBASE_HOSTING_URL=https://smartgrocer-nz.web.app
```

### Cloudflare Pages

Create `wrangler.toml` environment variables:

```toml
[env.production]
vars = { APP_ENV = "production", CF_PAGES_URL = "https://smartgrocer-nz.pages.dev" }
```

---

## Performance Optimization

### Build Optimization

```bash
npm run build
```

This produces:
- Minified JavaScript
- Optimized CSS
- Source maps disabled for production
- ~150KB bundle size (gzipped)

### Caching Strategy

#### Firebase
Configured in `firebase.json`:
- `.js` / `.css`: 1 year cache
- `index.html`: 1 hour cache

#### Cloudflare
Add to `wrangler.toml`:
```toml
[build.upload.rules]
type = "CompiledContentType"
globs = ["**/*.js"]
fallthrough = true
```

---

## Monitoring & Analytics

### Firebase
- Go to Firebase Console
- Monitor usage, errors, and performance
- Real-time traffic analytics

### Cloudflare
- Dashboard shows requests, cache ratio, threats
- Real-time analytics available

---

## Rollback & Updates

### Firebase
```bash
# View deployment history
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:clone --source=live --token=<token>
```

### Cloudflare Pages
Automatically keeps deployment history. Rollback via:
1. Pages project settings
2. Deployments tab
3. Click "Rollback" on previous deployment

---

## Cost Estimation

### Firebase Hosting (Free Tier)
- 10 GB/month storage
- 360 MB/day download
- Enough for ~5,000 daily active users

### Cloudflare Pages (Free Tier)
- Unlimited requests
- Unlimited bandwidth
- 1 build per minute

---

## Troubleshooting

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deployment Not Appearing
- Clear browser cache (Ctrl+Shift+Del)
- Check CDN cache: `npm run build && npm run deploy:firebase`

### Wrong Environment Variables
- Check `.env.local` isn't committing sensitive data
- Use `.env.example` as template
- Verify `VITE_` prefix for Vite variables

### Performance Issues
- Check bundle size: `npm run build` shows size
- Use Lighthouse in DevTools for audits
- Enable Cloudflare Caching for assets

---

## Security Checklist

- ✅ `.env.local` in `.gitignore`
- ✅ No hardcoded API keys
- ✅ HTTPS enabled (automatic)
- ✅ Content Security Policy configured
- ✅ XSS protection enabled
- ✅ Firebase security rules set (if using backend)

---

## Next Steps

1. Deploy to Firebase or Cloudflare
2. Test in production
3. Set up custom domain
4. Configure CI/CD automation
5. Monitor analytics and performance

---

Need help? Check the [README.md](./README.md) or create a GitHub issue!
