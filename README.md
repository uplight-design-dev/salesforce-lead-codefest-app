# Uplight IQ — Salesforce Lead Dashboard

Marketing lead intelligence dashboard for the Uplight AI Code Fest. Surfaces engaged contacts from Salesforce, pipeline metrics, and team performance.

## Quick start (local)

```bash
npm install
cp .env.example .env.local
# Fill in Salesforce Connected App credentials in .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | App base URL (e.g. `http://localhost:3000` or your Vercel URL) |
| `SALESFORCE_CLIENT_ID` | Connected App Consumer Key |
| `SALESFORCE_CLIENT_SECRET` | Connected App Consumer Secret |
| `SALESFORCE_REDIRECT_URI` | OAuth callback — must match Connected App exactly |
| `SALESFORCE_LOGIN_URL` | `https://login.salesforce.com` or your My Domain URL |
| `SALESFORCE_ENGAGED_CONTACTS_REPORT_ID` | Report ID for [SDR] 2026-Engaged Contacts |

**Salesforce OAuth:** Add your callback URL to the Connected App under **OAuth Settings → Callback URL**. For local dev:

```
http://localhost:3000/api/salesforce/callback
```

For production, use your deployed URL:

```
https://your-app.vercel.app/api/salesforce/callback
```

## Deploy to Vercel (demo)

1. Push this repo to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add the environment variables from `.env.example` in the Vercel project settings.
4. Set `NEXT_PUBLIC_APP_URL` and `SALESFORCE_REDIRECT_URI` to your Vercel deployment URL.
5. Add the production callback URL to your Salesforce Connected App.
6. Deploy.

The dashboard renders with mock data when Salesforce is not connected. Live report data requires OAuth plus valid env vars.

## Features

- Overview dashboard with pipeline KPIs and deal momentum
- Leads table synced from Salesforce report `[SDR] 2026-Engaged Contacts`
- Lead detail pages with engagement timeline
- Salesforce OAuth connect flow (Settings)
- Google Analytics integration (placeholder)

## Tech stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS 4
