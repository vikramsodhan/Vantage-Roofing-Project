# Vantage Roofing — Data Migration Script

One-time script to migrate historical job data from Google Sheets CSV exports
into Supabase. Handles 2025 and 2026 data. Earlier years pending stakeholder
clarification on work type normalization.

---

## Prerequisites

- Python 3.11+
- Access to the Supabase project (service role key)
- Google Sheets exported as CSV (see step 3 below)

---

## Setup

**1. Create a virtual environment**

```bash
cd scripts
python -m venv venv
source venv/bin/activate      # Mac/Linux
venv\Scripts\activate         # Windows
```

**2. Install dependencies**

```bash
pip install -r requirements.txt
```

**3. Export CSV files from Google Sheets**

- Open the Google Sheet
- Click the 2025 tab → File → Download → Comma Separated Values
- Save as `scripts/data/jobs_2025.csv`
- Repeat for the 2026 tab → save as `scripts/data/jobs_2026.csv`

These files are gitignored and should never be committed.

**4. Configure environment**

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your Supabase project URL and service role key.
Both are found in the Supabase dashboard under Settings → API.

The service role key bypasses all RLS policies — keep it local only.

---

## Pre-flight Checklist

Before running, confirm the following exist in the database:

- [ ] `Unknown` profile row in profiles table
- [ ] `N/A` division row in divisions table
- [ ] `Unclassified` work type row in work_types table
- [ ] At least one active owner profile (used as `entered_by` for all migrated rows)
- [ ] Profile rows for Don and Gary (or whoever appears in the Salesperson column)

---

## Running the Script

**Always run against a test Supabase project first.**

```bash
python migrate.py
```

The script will print a summary of inserted and skipped rows. Any skipped rows
are written to `scripts/logs/skipped.csv` for manual review.

---

## After the Migration

1. Check row counts in Supabase — should match what you expect from the sheet
2. Spot-check 10–15 rows manually against the original sheet
3. Confirm calculated fields in `jobs_with_calculations` view look correct
4. Review `scripts/logs/skipped.csv` and handle any rows that need manual entry

---

## Production Run

The same script runs against production. Before the production run:

1. Have all team members sign in at least once so their profile UUIDs exist
2. Update `scripts/.env.local` to point at the production Supabase project
3. Run against production
4. Verify, then delete the service role key from your local environment

---

## Notes

- Safe to re-run against a **fresh** database — does not check for duplicates
- Do NOT re-run against a database that already has migrated data
- Columns A–R only — calculated tables to the right of the main data are ignored
- Calculated fields (Total Job Cost, Total Cost%, MGN, etc.) are never imported
  — the `jobs_with_calculations` view computes these automatically
