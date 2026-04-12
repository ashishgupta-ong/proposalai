# ProposalAI

AI-powered proposal generator with multi-developer profiles, portfolio matching, and Google Drive sync.

## Features
- Generate tailored proposals per developer with one click
- Auto-matches portfolio projects to job descriptions
- $15–$20/hr rate slider per proposal
- Google Drive sync — access from any computer
- 60+ projects pre-loaded from your portfolio

## Setup

### 1. Install dependencies
```
npm install
```

### 2. Run locally
```
npm start
```
Open http://localhost:3000

### 3. Add your API keys in the app sidebar
- **Anthropic API key** — get from console.anthropic.com
- **Google Client ID** — see below

### Google OAuth Setup (for Drive sync)
1. Go to https://console.cloud.google.com
2. Create a project → Enable **Google Drive API**
3. Credentials → Create → OAuth 2.0 Client ID → Web application
4. Add your Railway domain to **Authorized JavaScript origins** (e.g. `https://proposalai.up.railway.app`)
5. Copy Client ID and paste it into `public/index.html` where it says `YOUR_GOOGLE_CLIENT_ID_HERE`

## Deploy on Railway
1. Push this repo to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Select this repo → Railway auto-detects Node.js and deploys
4. Every `git push` to main auto-redeploys ✓

## Project structure
```
proposalai/
├── public/
│   └── index.html     ← The entire app (HTML + JS + CSS)
├── server.js          ← Express server (serves the app)
├── package.json
└── .gitignore
```
