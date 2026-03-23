"""
Sync cleaned fragrance data to Supabase via REST API.
Uses httpx directly to avoid supabase client key-format compatibility issues.

Usage:
    Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env at the project root, then run:
    python scripts/etl/sync_to_supabase.py
"""

import os
import ast
import sys
import time
import json
from pathlib import Path
import pandas as pd
import httpx
from dotenv import load_dotenv

project_root = Path(__file__).parent.parent.parent
load_dotenv(project_root / ".env")

sys.path.insert(0, str(Path(__file__).parent))
from infer_metadata import add_inferred_metadata


def parse_list_column(value) -> list:
    if isinstance(value, list):
        return [str(x).strip() for x in value if x]
    try:
        if pd.isna(value):
            return []
    except (TypeError, ValueError):
        pass
    if not value:
        return []
    try:
        parsed = ast.literal_eval(str(value).strip())
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if x]
    except (ValueError, SyntaxError):
        pass
    return []


def parse_rating_count(value) -> int:
    if pd.isna(value) or not value:
        return 0
    try:
        return int(str(value).replace(",", "").strip())
    except (ValueError, TypeError):
        return 0


def convert_rating_to_ten(value) -> float | None:
    if pd.isna(value) or value == "":
        return None
    try:
        v = float(str(value).strip())
        return round(v / 10.0, 2)
    except (ValueError, TypeError):
        return None


# Valid DB constraint values
VALID_CONCENTRATION = frozenset({"cologne", "edt", "edp", "parfum", "extrait"})


def clean_str(value) -> str | None:
    """Convert a value to a clean string, returning None for NaN/empty."""
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    s = str(value).strip()
    return s if s and s.lower() != "nan" else None


def normalize_concentration(value) -> str | None:
    """Map concentration to valid DB values; invalid -> None."""
    c = clean_str(value)
    if not c:
        return None
    low = c.lower()
    return low if low in VALID_CONCENTRATION else None


def safe_year(value) -> int | None:
    """Safely convert to int year or None."""
    if value is None or (hasattr(value, "__float__") and pd.isna(value)):
        return None
    s = str(value).strip()
    if not s or s.lower() == "nan":
        return None
    try:
        n = int(float(s))
        return n if 1900 <= n <= 2100 else None
    except (ValueError, TypeError):
        return None


def ensure_list(val) -> list:
    """Ensure value is a JSON-serializable list."""
    if val is None:
        return []
    if isinstance(val, list):
        return [str(x) for x in val if x is not None]
    return []


def prepare_row(row: pd.Series) -> dict:
    return {
        "brand": clean_str(row.get("Brand")),
        "perfume": clean_str(row.get("Perfume")),
        "gender": clean_str(row.get("Gender")),
        "rating_value": convert_rating_to_ten(row.get("Rating Value")),
        "rating_count": parse_rating_count(row.get("Rating Count")),
        "year": safe_year(row.get("Year")),
        "concentration": normalize_concentration(row.get("Concentration")),
        "main_accords": parse_list_column(row.get("Main Accords")),
        "top_notes": parse_list_column(row.get("Top")),
        "middle_notes": parse_list_column(row.get("Middle")),
        "base_notes": parse_list_column(row.get("Base")),
        "perfumer": clean_str(row.get("Perfumer1")),
        "fragrantica_url": clean_str(row.get("url")),
        "best_season": ensure_list(row.get("best_season")),
        "best_time": ensure_list(row.get("best_time")),
    }


def sync_to_supabase(batch_size: int = 200):
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY", "")

    if not url or not key:
        print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
        sys.exit(1)

    endpoint = f"{url}/rest/v1/fragrances?on_conflict=brand,perfume"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    # Test connection first
    print("Testing connection to Supabase...")
    with httpx.Client(timeout=30) as client:
        resp = client.get(f"{url}/rest/v1/fragrances?limit=1", headers=headers)
        if resp.status_code not in (200, 206):
            print(f"Connection failed: {resp.status_code} — {resp.text[:200]}")
            sys.exit(1)
    print("Connection OK.")

    data_folder = project_root / "data"
    cleaned_path = data_folder / "cleaned_data.csv"
    failed_path = data_folder / "sync_failed_rows.csv"

    if not cleaned_path.exists():
        print(f"cleaned_data.csv not found. Run data_processing.py first.")
        sys.exit(1)

    print(f"Loading {cleaned_path}...")
    df = pd.read_csv(cleaned_path, sep=",", encoding="utf-8", low_memory=False)
    print(f"Loaded {len(df):,} rows")

    for col in ["Top", "Middle", "Base", "Main Accords"]:
        if col in df.columns:
            df[col] = df[col].apply(parse_list_column)

    print("Inferring season and time metadata...")
    import time as _time
    t0 = _time.time()
    df = add_inferred_metadata(df)
    print(f"Metadata inference done in {_time.time() - t0:.1f}s")

    pre_dedup = len(df)
    df = df.drop_duplicates(subset=["Brand", "Perfume"], keep="last")
    print(f"Deduplicated: {pre_dedup:,} -> {len(df):,} rows")

    total = len(df)
    total_ok = 0
    total_err = 0
    failed_rows: list[dict] = []

    print(f"\nSyncing {total:,} fragrances in batches of {batch_size}...\n")

    total_batches = (total + batch_size - 1) // batch_size

    def insert_one(client: httpx.Client, rec: dict) -> tuple[bool, str]:
        """Insert single row; return (success, error_msg)."""
        try:
            r = client.post(endpoint, headers=headers, content=json.dumps([rec]))
            if r.status_code in (200, 201):
                return True, ""
            return False, f"{r.status_code}: {r.text[:200]}"
        except Exception as e:
            return False, str(e)

    for i in range(0, total, batch_size):
        batch_df = df.iloc[i : i + batch_size]
        records = [prepare_row(row) for _, row in batch_df.iterrows()]
        records = [r for r in records if r["brand"] and r["perfume"]]

        if not records:
            continue

        batch_num = i // batch_size + 1

        for attempt in range(3):
            try:
                with httpx.Client(timeout=30) as client:
                    resp = client.post(endpoint, headers=headers, content=json.dumps(records))
                break
            except (httpx.ReadError, httpx.ConnectError, httpx.TimeoutException) as exc:
                if attempt < 2:
                    wait = 5 * (attempt + 1)
                    print(f"  Batch {batch_num}/{total_batches}: connection error, retrying in {wait}s ({exc})")
                    time.sleep(wait)
                else:
                    print(f"  Batch {batch_num}/{total_batches}: FAILED after 3 attempts — {exc}")
                    total_err += len(records)
                    for r in records:
                        failed_rows.append({**r, "error": str(exc)})
                    resp = None

        if resp is None:
            continue

        if resp.status_code in (200, 201):
            total_ok += len(records)
            print(f"  Batch {batch_num}/{total_batches}: {len(records)} rows OK  ({total_ok:,}/{total:,} total)")
        else:
            # Batch failed: retry each row individually to salvage good rows
            print(f"  Batch {batch_num}/{total_batches}: ERROR {resp.status_code}, retrying row-by-row...")
            batch_ok = 0
            with httpx.Client(timeout=30) as client:
                for rec in records:
                    ok, err = insert_one(client, rec)
                    if ok:
                        total_ok += 1
                        batch_ok += 1
                    else:
                        total_err += 1
                        failed_rows.append({**rec, "error": err})
                    time.sleep(0.02)
            print(f"    -> {batch_ok}/{len(records)} recovered; {total_ok:,}/{total:,} total")

        time.sleep(0.05)

    # Save failed rows for inspection
    if failed_rows:
        fail_df = pd.DataFrame(failed_rows)
        fail_df.to_csv(failed_path, index=False, encoding="utf-8")
        print(f"\nFailed rows saved to: {failed_path}")

    print(f"\nDone. {total_ok:,} rows synced, {total_err:,} errors.")


if __name__ == "__main__":
    sync_to_supabase()
