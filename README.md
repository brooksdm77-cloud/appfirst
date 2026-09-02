# 🛒 SmartGrocer NZ

A modern web application for comparing prices across NZ supermarkets and optimizing shopping trips with intelligent price analysis and multi-store routing.

## ✨ Features

- **🔐 Secure Authentication** - Sign in/registration with session persistence
- **📝 Shopping Lists** - Organize items into weekly and occasional categories
- **💰 Price Comparison** - Real-time price comparison across Woolworths, PAK'nSAVE, and New World
- **🎯 Smart Optimization** - Automatic single-store vs. multi-store trip analysis
- **✨ Deal Detection** - Automated alerts for items matching discount thresholds
- **📊 Detailed Analytics** - Visualize potential savings and store breakdowns
- **🚀 Production Ready** - Built with modern React, TypeScript, and Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Deployment**: Firebase Hosting + Cloudflare Pages

## 📋 Prerequisites

- Node.js 16+ and npm (or yarn/pnpm)
- Firebase CLI (for Firebase deployment)
- Wrangler CLI (for Cloudflare deployment)

## 🚀 Getting Started

### 1. Installation

```bash
# Install dependencies
npm install

# Or with yarn/pnpm
yarn install
pnpm install
```

### 2. Development

```bash
# Start dev server (opens at http://localhost:3000)
npm run dev
```

### 3. Build

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

## 🌐 Deployment

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy
npm run deploy:firebase
```

**First time setup:**
1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Update project ID in `.firebaserc`
3. Enable Firebase Hosting

### Cloudflare Pages

```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate
wrangler login

# Deploy
npm run deploy:cloudflare
```

**First time setup:**
1. Create Cloudflare account at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Add account_id to `wrangler.toml`
3. Configure custom domain in Cloudflare dashboard

### GitHub Actions (CI/CD - Optional)

Create `.github/workflows/deploy.yml` for automatic deployments:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: smartgrocer-nz
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── AuthScreen.tsx       # Login/registration UI
│   ├── ShoppingListsPanel.tsx  # List management
│   ├── RecommendationsPanel.tsx # Deals & optimization
│   └── OptimizationResults.tsx  # Results display
├── store/              # Zustand state management
│   └── appStore.ts         # App state & actions
├── utils/              # Utility functions
│   ├── optimizer.ts        # Basket optimization logic
│   └── constants.ts        # Product data & constants
├── types/              # TypeScript types
│   └── index.ts            # Type definitions
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles

public/                # Static assets
dist/                  # Production build output
```

## 🔐 Demo Account

The app comes with a demo account for testing:

- **Email**: `student@uni.ac.nz`
- **Password**: `password123`

## 🎨 Customization

### Add Products to Catalog

Edit `src/utils/constants.ts`:

```typescript
export const NZ_SUPERMARKET_CATALOGUE: Record<string, Product> = {
  "Product Name": {
    name: "Product Name",
    prices: {
      Woolworths: 10.00,
      PAKnSAVE: 8.99,
      NewWorld: 9.50,
    },
    historicAvg: 9.50,
  },
  // ... more products
}
```

### Customize Discount Threshold

Edit `src/utils/constants.ts`:

```typescript
export const DISCOUNT_THRESHOLD = 0.88 // 12% discount (0.88 = 12% off)
```

### Modify Styling

Global styles in `src/index.css` use Tailwind CSS. Customize theme in `tailwind.config.js`.

## 📊 Performance Optimization

- ✅ Code splitting with Vite
- ✅ Tree-shaking for smaller bundles
- ✅ Lazy loading of components
- ✅ Production source maps disabled
- ✅ CSS minification
- ✅ Image optimization ready

## 🧪 Testing (Optional)

To add testing setup:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

Create `src/__tests__/optimizer.test.ts` for unit tests.

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
PORT=3001 npm run dev
```

### Firebase deployment fails
- Verify project ID in `.firebaserc`
- Check Firebase billing is enabled
- Ensure you're logged in: `firebase login`

### Cloudflare deployment fails
- Verify account_id in `wrangler.toml`
- Check Wrangler authentication: `wrangler login`

## 📝 License

MIT License - Feel free to use this project as a template!

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues or questions, please create a GitHub issue or contact the development team.

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
