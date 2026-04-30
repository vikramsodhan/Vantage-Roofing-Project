# =============================================================================
# ONE-TIME MIGRATION SCRIPT
# Migrates 2025 and 2026 job data from Google Sheets CSV exports into Supabase.
# Run locally only — never deploy this file.
#
# Setup:
#   1. Copy .env.example to .env.local and fill in your values
#   2. Export the 2025 tab from Google Sheets as CSV → scripts/data/jobs_2025.csv
#   3. Export the 2026 tab from Google Sheets as CSV → scripts/data/jobs_2026.csv
#   4. pip install -r requirements.txt
#   5. python migrate.py
#
# Output:
#   - Prints a summary of inserted and skipped rows
#   - Writes skipped rows to scripts/logs/skipped.csv for manual review
#
# Safe to re-run against a fresh database. Do NOT run against a database
# that already has migrated data — it will create duplicates.
# =============================================================================

import os
import logging
import re
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------

load_dotenv(Path(__file__).parent / ".env.local")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

DATA_DIR = Path(__file__).parent / "data"
LOG_DIR  = Path(__file__).parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

FILES = {
    2025: DATA_DIR / "jobs_2025.csv",
    2026: DATA_DIR / "jobs_2026.csv",
}

# Columns A-R only. Calculated tables to the right are ignored.
USECOLS = list(range(18))

# Calculated columns present in both years - never imported.
# The jobs_with_calculations view computes these automatically.
SKIP_COLUMNS = {"Total Job Cost", "Total Cost%"}

BATCH_SIZE = 50

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

MONTH_MAP = {
    "jan": 1,  "feb": 2,  "mar": 3,  "apr": 4,
    "may": 5,  "jun": 6,  "jul": 7,  "aug": 8,
    "sep": 9,  "oct": 10, "nov": 11, "dec": 12,
}

def parse_month_date(value, year: int) -> str | None:
    """
    Converts a month abbreviation + sheet year into YYYY-MM-01.
    Returns None for blank, "-", or numeric values.
    Numeric values indicate a carry-over from a previous year
    and are treated as unknown per spec.
    """
    if pd.isna(value) or not str(value).strip():
        return None
    cleaned = str(value).strip().lower()
    if cleaned == "-":
        return None
    if cleaned.replace(".", "").isdigit():
        return None
    month_num = MONTH_MAP.get(cleaned[:3])
    if month_num is None:
        return None
    return f"{year}-{month_num:02d}-01"


def parse_sold(value) -> bool:
    """'Y' -> True, anything else -> False."""
    if pd.isna(value):
        return False
    return str(value).strip().upper() == "Y"


def str_or_none(value) -> str | None:
    """Returns stripped string or None for blank/NaN values."""
    if pd.isna(value) or not str(value).strip():
        return None
    return str(value).strip()

def clean_work_type_key(value: str) -> str:
    if not value:
        return value
    
    value = re.sub(r"\s*_\s*", "_", value)

    value = re.sub(r"\s{2,}", " ", value)

    return value.strip()

# -----------------------------------------------------------------------------
# DB reference data loaders
# Called once at startup - results cached in dicts for O(1) row lookups.
# -----------------------------------------------------------------------------

def load_profiles(supabase: Client) -> dict[str, str]:
    """Returns { lowercased_full_name: uuid } for all profiles."""
    rows = supabase.table("profiles").select("id, full_name").execute().data
    return {
        row["full_name"].strip().lower(): row["id"]
        for row in rows
        if row["full_name"]
    }


def load_divisions(supabase: Client) -> dict[str, str]:
    """Returns { division_name: uuid } for all divisions."""
    rows = supabase.table("divisions").select("id, name").execute().data
    return {row["name"].strip(): row["id"] for row in rows}


def load_work_types(supabase: Client) -> dict[str, str]:
    """Returns { work_type_name: uuid } for all work types."""
    rows = supabase.table("work_types").select("id, name").execute().data
    return {row["name"].strip(): row["id"] for row in rows}

# -----------------------------------------------------------------------------
# Row transformer
# -----------------------------------------------------------------------------

def transform_row(
    row: pd.Series,
    year: int,
    sheet_row: int,
    profiles: dict[str, str],
    divisions: dict[str, str],
    work_types: dict[str, str],
    unknown_profile_id: str,
    na_division_id: str,
    unclassified_work_type_id: str,
    entered_by_id: str,
) -> tuple[dict | None, str | None]:
    """
    Returns (payload, None) on success.
    Returns (None, reason) if the row should be skipped entirely.
    """

    job_address     = str_or_none(row.get("Job Address"))
    division_raw    = str_or_none(row.get("Div"))
    mq_raw          = str_or_none(row.get("MQ"))
    ms_raw          = str_or_none(row.get("MS"))
    sold_raw        = row.get("Sold")
    work_type_raw   = str_or_none(row.get("Type of Work"))
    salesperson_raw = str_or_none(row.get("Salesperson"))

    # Check if the row has any cost data
    # Numeric columns are already cleaned floats at this point
    cost_fields = ["Materials", "Labour", "Disposal", "Warranty", "OTH", "Gutters", "Sales Price"]
    has_cost_data = any(float(row.get(col) or 0) > 0 for col in cost_fields)

    # Truly empty rows - skip entirely
    if not job_address and not has_cost_data:
        return None, "Empty row - no address or cost data"

    # Rows with cost data but no address get "N/A" per spec
    if not job_address:
        job_address = "N/A"

    # Division - fall back to N/A placeholder
    if division_raw and division_raw != "-":
        division_id = divisions.get(division_raw, na_division_id)
    else:
        division_id = na_division_id
    
    work_type_clean = clean_work_type_key(work_type_raw)

    # Work type - fall back to Unclassified placeholder
    if work_type_clean and work_type_clean != "-":
        work_type_id = work_types.get(work_type_clean, unclassified_work_type_id)
        if work_type_id == unclassified_work_type_id:
            log.warning(
                f"  Row {sheet_row}: work type '{work_type_clean}' not found "
                f"- assigned Unclassified. Job: '{job_address}'"
            )
    else:
        work_type_id = unclassified_work_type_id

    # Salesperson - fall back to Unknown placeholder
    if salesperson_raw and salesperson_raw != "-":
        salesperson_id = profiles.get(salesperson_raw.lower(), unknown_profile_id)
        if salesperson_id == unknown_profile_id:
            log.warning(
                f"  Row {sheet_row}: salesperson '{salesperson_raw}' not found "
                f"- assigned Unknown. Job: '{job_address}'"
            )
    else:
        salesperson_id = unknown_profile_id

    payload = {
        "job_address":    job_address,
        "division_id":    division_id,
        "month_quoted":   parse_month_date(mq_raw, year),
        "month_sold":     parse_month_date(ms_raw, year),
        "sold":           parse_sold(sold_raw),
        "work_type_id":   work_type_id,
        "salesperson_id": salesperson_id,
        "squares":        float(row.get("Sq") or 0),
        "days":           float(row.get("Days") or 0),
        "materials":      float(row.get("Materials") or 0),
        "labour":         float(row.get("Labour") or 0),
        "disposal":       float(row.get("Disposal") or 0),
        "warranty":       float(row.get("Warranty") or 0),
        "other":          float(row.get("OTH") or 0),
        "gutters":        float(row.get("Gutters") or 0),
        "sales_price":    float(row.get("Sales Price") or 0),
        "entered_by":     entered_by_id,
    }

    return payload, None

# -----------------------------------------------------------------------------
# Batch insert
# -----------------------------------------------------------------------------

def insert_batch(supabase: Client, batch: list[dict]) -> list[dict]:
    """
    Inserts a batch of rows into jobs.
    Returns failed rows as { payload, error } dicts for the skipped log.
    """
    try:
        supabase.table("jobs").insert(batch).execute()
        return []
    except Exception as e:
        log.error(f"  Batch insert failed: {e}")
        return [{"payload": row, "error": str(e)} for row in batch]

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

def main():
    log.info("Connecting to Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    log.info("Loading reference data from DB...")
    profiles   = load_profiles(supabase)
    divisions  = load_divisions(supabase)
    work_types = load_work_types(supabase)

    # Validate placeholder records exist before processing any data
    unknown_profile_id        = profiles.get("unknown")
    na_division_id            = divisions.get("N/A")
    unclassified_work_type_id = work_types.get("Unclassified")

    if not unknown_profile_id:
        raise RuntimeError("Unknown profile not found. Add it to the profiles table first.")
    if not na_division_id:
        raise RuntimeError("N/A division not found. Add it to the divisions table first.")
    if not unclassified_work_type_id:
        raise RuntimeError("Unclassified work type not found. Add it to the work_types table first.")

    # Use the first active owner as entered_by for all migrated rows
    owner = (
        supabase.table("profiles")
        .select("id")
        .eq("role", "owner")
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    if not owner.data:
        raise RuntimeError("No active owner found. Create an owner profile before running.")
    entered_by_id = owner.data[0]["id"]
    log.info(f"Migration stamped as entered_by: {entered_by_id}")

    all_skipped    = []
    total_inserted = 0
    total_skipped  = 0

    for year, path in FILES.items():
        if not path.exists():
            log.warning(f"File not found, skipping {year}: {path}")
            continue

        log.info(f"\nProcessing {year} - {path.name}")

        # Read only columns A-R, keep everything as strings to avoid
        # pandas silently converting "Y" to True or month names to dates
        df = pd.read_csv(
            path,
            usecols=USECOLS,
            dtype=str,
            keep_default_na=False,
            na_values=[""],
        )

        # Drop calculated columns - present in both years
        df = df.drop(columns=[c for c in SKIP_COLUMNS if c in df.columns])

        # Clean and convert numeric columns using pandas.
        # str.replace handles $ and commas before conversion.
        # errors="coerce" turns anything unparseable into NaN.
        # fillna(0.0) replaces NaN with 0 per schema defaults.
        # round(2) matches the decimal(12,2) / decimal(10,2) DB columns.
        NUMERIC_COLS = ["Sq", "Days", "Materials", "Labour", "Disposal",
                        "Warranty", "OTH", "Gutters", "Sales Price"]
        for col in NUMERIC_COLS:
            if col in df.columns:
                df[col] = (
                    pd.to_numeric(
                        df[col].str.replace(",", "", regex=False)
                               .str.replace("$", "", regex=False),
                        errors="coerce"
                    )
                    .fillna(0.0)
                    .round(2)
                )

        log.info(f"  Columns: {list(df.columns)}")
        log.info(f"  {len(df)} rows read")

        batch         = []
        year_inserted = 0
        year_skipped  = 0

        for idx, row in df.iterrows():
            sheet_row = idx + 2  # +2: pandas is 0-indexed, row 1 is headers

            payload, skip_reason = transform_row(
                row=row,
                year=year,
                sheet_row=sheet_row,
                profiles=profiles,
                divisions=divisions,
                work_types=work_types,
                unknown_profile_id=unknown_profile_id,
                na_division_id=na_division_id,
                unclassified_work_type_id=unclassified_work_type_id,
                entered_by_id=entered_by_id,
            )

            if payload is None:
                log.debug(f"  Row {sheet_row} skipped: {skip_reason}")
                all_skipped.append({
                    "year": year,
                    "sheet_row": sheet_row,
                    "reason": skip_reason,
                    **row.to_dict(),
                })
                year_skipped += 1
                continue

            batch.append(payload)

            if len(batch) >= BATCH_SIZE:
                failed = insert_batch(supabase, batch)
                year_inserted += len(batch) - len(failed)
                year_skipped  += len(failed)
                for f in failed:
                    all_skipped.append({
                        "year": year,
                        "sheet_row": "batch",
                        "reason": f["error"],
                        **f["payload"],
                    })
                batch = []

        # Flush remaining rows
        if batch:
            failed = insert_batch(supabase, batch)
            year_inserted += len(batch) - len(failed)
            year_skipped  += len(failed)
            for f in failed:
                all_skipped.append({
                    "year": year,
                    "sheet_row": "batch",
                    "reason": f["error"],
                    **f["payload"],
                })

        log.info(f"  {year} done - {year_inserted} inserted, {year_skipped} skipped")
        total_inserted += year_inserted
        total_skipped  += year_skipped

    # Write skipped log - pandas makes this one line
    if all_skipped:
        skipped_path = LOG_DIR / "skipped.csv"
        pd.DataFrame(all_skipped).to_csv(skipped_path, index=False)
        log.info(f"\nSkipped rows written to {skipped_path}")

    log.info(f"\n{'='*50}")
    log.info(f"Migration complete")
    log.info(f"  Total inserted : {total_inserted}")
    log.info(f"  Total skipped  : {total_skipped}")
    log.info(f"{'='*50}")


if __name__ == "__main__":
    main()