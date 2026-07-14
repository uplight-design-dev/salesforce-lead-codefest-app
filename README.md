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
| `SALESFORCE_LOGIN_URL` | `https://uplight--partial2.sandbox.my.salesforce.com` (partial2 sandbox OAuth) |
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

Live demo: [salesforce-lead-codefest-app.vercel.app](https://salesforce-lead-codefest-app.vercel.app)

### 1. Vercel environment variables

In your Vercel project → **Settings → Environment Variables**, set:

| Variable | Production value |
|----------|------------------|
| `NEXT_PUBLIC_APP_URL` | `https://salesforce-lead-codefest-app.vercel.app` |
| `SALESFORCE_CLIENT_ID` | Your Connected App Consumer Key |
| `SALESFORCE_CLIENT_SECRET` | Your Connected App Consumer Secret |
| `SALESFORCE_REDIRECT_URI` | `https://salesforce-lead-codefest-app.vercel.app/api/salesforce/callback` |
| `SALESFORCE_LOGIN_URL` | `https://uplight--partial2.sandbox.my.salesforce.com` |
| `SALESFORCE_ENGAGED_CONTACTS_REPORT_ID` | `00OWE00000DaPek2AF` |

Redeploy after saving env vars.

### 2. Salesforce Connected App callback URLs

In Salesforce → **Setup → App Manager → [Your Connected App] → Edit → OAuth Settings**, add **both** callback URLs (one per line):

```
https://salesforce-lead-codefest-app.vercel.app/api/salesforce/callback
http://localhost:3000/api/salesforce/callback
```

Save and wait a few minutes for Salesforce to propagate changes.

### 3. Connect

Open [Settings](https://salesforce-lead-codefest-app.vercel.app/settings) on the live app and click **Connect Salesforce**.

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
# uplight-projects
# uplight-projects
# uplight-projects
