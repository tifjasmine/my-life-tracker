# My Life Tracker

A Netlify-ready React PWA migrated from Softr + Apps Script patterns.

## Local setup

```bash
npm install
npm run dev
```

## Netlify environment variables

Required for live Airtable data:

```bash
AIRTABLE_PAT=pat...
AIRTABLE_BASE_ID=appxSbFxzUd4xCbTn
```

Optional table overrides:

```bash
AIRTABLE_TASKS_TABLE=Tasks
AIRTABLE_NOTES_TABLE=Notes
AIRTABLE_LINKS_TABLE=Links
AIRTABLE_CLIENTS_TABLE=Weekly Sessions
AIRTABLE_EXPENSES_TABLE=Expenses By Month
AIRTABLE_INCOME_TABLE=Income
AIRTABLE_DEBT_TABLE=Total Debt
LINKS_TABLE_ID=tbl...
```

Optional Google Calendar:

```bash
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

## Deploy

Netlify build command:

```bash
npm run build
```

Publish directory:

```bash
dist
```
