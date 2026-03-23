"""
Quick script to verify fragrance data in Supabase.
Run from project root: python scripts/etl/check_supabase_data.py
"""
import os
import sys
from pathlib import Path
import httpx
from dotenv import load_dotenv

project_root = Path(__file__).parent.parent.parent
load_dotenv(project_root / ".env")

url = os.environ.get("SUPABASE_URL", "").rstrip("/")
key = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not url or not key:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
    sys.exit(1)

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
}

# Count fragrances using Prefer: count=exact
with httpx.Client(timeout=15) as client:
    resp = client.get(
        f"{url}/rest/v1/fragrances?select=id&limit=1",
        headers={**headers, "Prefer": "count=exact"}
    )
    if resp.status_code in (200, 206):
        count = resp.headers.get("content-range", "")
        # Format: "0-0/12345" or "0-1/12345"
        total = count.split("/")[-1] if "/" in count else "?"
        print(f"Supabase fragrances table: {total} rows")
    else:
        print(f"Error {resp.status_code}: {resp.text[:200]}")
