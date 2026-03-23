"""
Analyze which rows were dropped during sync_to_supabase.
Replicates the exact sync logic and reports dropped rows.

Run: python scripts/etl/analyze_dropped_rows.py
"""

import sys
from pathlib import Path
import pandas as pd

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(Path(__file__).parent))

from sync_to_supabase import parse_list_column, prepare_row, clean_str
from infer_metadata import add_inferred_metadata

data_folder = project_root / "data"
cleaned_path = data_folder / "cleaned_data.csv"

if not cleaned_path.exists():
    print("cleaned_data.csv not found.")
    sys.exit(1)

df = pd.read_csv(cleaned_path, sep=",", encoding="utf-8", low_memory=False)
print(f"Loaded {len(df):,} rows from cleaned_data.csv")

# Parse list columns (same as sync)
for col in ["Top", "Middle", "Base", "Main Accords"]:
    if col in df.columns:
        df[col] = df[col].apply(parse_list_column)

# Add inferred metadata
df = add_inferred_metadata(df)

# --- 1. Duplicates (keep="last" means earlier duplicates are dropped) ---
dup_mask = df.duplicated(subset=["Brand", "Perfume"], keep="last")
duplicates_dropped = df[dup_mask].copy()
duplicates_dropped["drop_reason"] = "duplicate (earlier occurrence)"

# --- 2. Empty brand or perfume (after clean_str) ---
def _has_valid_brand_perfume(row):
    brand = clean_str(row.get("Brand"))
    perfume = clean_str(row.get("Perfume"))
    return bool(brand and perfume)

valid_mask = df.apply(_has_valid_brand_perfume, axis=1)
empty_brand_perfume = df[~valid_mask & ~dup_mask].copy()
empty_brand_perfume["drop_reason"] = "empty brand or perfume"

# --- Combine and report ---
dropped = pd.concat([duplicates_dropped, empty_brand_perfume], ignore_index=True)

print("\n" + "=" * 60)
print("DROPPED ROWS SUMMARY")
print("=" * 60)
print(f"Total in cleaned_data.csv:     {len(df):,}")
print(f"Duplicates (kept last):       {len(duplicates_dropped):,}")
print(f"Empty brand/perfume:          {len(empty_brand_perfume):,}")
print(f"Total dropped:                {len(dropped):,}")
print(f"Expected in Supabase:        {len(df) - len(duplicates_dropped) - len(empty_brand_perfume):,}")
print("=" * 60)

# Export dropped rows to CSV
output_path = data_folder / "dropped_rows.csv"
cols_to_export = ["Brand", "Perfume", "Gender", "Rating Value", "url", "drop_reason"]
available_cols = [c for c in cols_to_export if c in dropped.columns]
dropped[available_cols].to_csv(output_path, index=False, encoding="utf-8")
print(f"\nDropped rows exported to: {output_path}")

# Show sample of each category
if len(duplicates_dropped) > 0:
    print("\n--- Sample duplicates (first 10) ---")
    print(duplicates_dropped[["Brand", "Perfume", "url"]].head(10).to_string(index=False))

if len(empty_brand_perfume) > 0:
    print("\n--- Sample empty brand/perfume (first 10) ---")
    sample = empty_brand_perfume[["Brand", "Perfume", "url"]].head(10)
    print(sample.to_string(index=False))
