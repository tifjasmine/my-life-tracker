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
AIRTABLE_TODAY_TABLE="Today I will"
AIRTABLE_TODAY_TEXT_FIELD=Content
AIRTABLE_TODAY_DATE_FIELD="Checklist Date"
AIRTABLE_TODAY_DONE_FIELD=Done
AIRTABLE_EXPENSES_TABLE=Expenses By Month
AIRTABLE_INCOME_TABLE=Income
AIRTABLE_DEBT_TABLE=Total Debt
LINKS_TABLE_ID=tbl...
```

If finances live in a separate Airtable base, add:

```bash
FINANCE_AIRTABLE_BASE_ID=appVlWgUhBB73PDa4
FINANCE_AIRTABLE_TABLE_ID=tblTe5SntepDSbEpS
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
