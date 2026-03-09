"""
Generic CSV loader for pandas DataFrames.
Scans a folder for CSVs, infers delimiter when possible, and returns DataFrames.
"""

from pathlib import Path
import pandas as pd
import csv


def _sniff_delimiter(sample_bytes: bytes, default: str = ",") -> str:
    """Try to detect the delimiter from a byte sample."""
    try:
        dialect = csv.Sniffer().sniff(sample_bytes.decode("utf-8", errors="ignore"), delimiters=[",", ";", "\t", "|"])
        return dialect.delimiter
    except Exception:
        return default


def _detect_encoding(file_path: Path, encodings: list[str] = None) -> str:
    """
    Try to detect the file encoding by attempting to read with different encodings.
    
    Args:
        file_path: Path to the file
        encodings: List of encodings to try (default: common encodings)
    
    Returns:
        str: The first encoding that successfully reads the file
    """
    if encodings is None:
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1', 'utf-16']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                f.read(1024)  # Try reading a small sample
            return encoding
        except (UnicodeDecodeError, UnicodeError):
            continue
    
    # Fallback to latin-1 (most permissive)
    return 'latin-1'


def load_csv_folder(
    data_folder: str | Path,
    pattern: str = "*.csv",
    default_delimiter: str = ",",
    encoding: str = "utf-8",
    **read_csv_kwargs,
) -> dict[str, pd.DataFrame]:
    """
    Load all CSV files matching pattern in a folder into pandas DataFrames.

    Args:
        data_folder: Folder containing CSV files.
        pattern: Glob pattern to match files (default: "*.csv").
        default_delimiter: Fallback delimiter if sniffing fails.
        encoding: Text encoding for files (default: "utf-8").
        **read_csv_kwargs: Extra kwargs passed to pandas.read_csv.

    Returns:
        dict: {file_stem: DataFrame}
    """
    data_folder = Path(data_folder)
    dfs: dict[str, pd.DataFrame] = {}

    for csv_path in data_folder.glob(pattern):
        # Detect encoding if default fails
        detected_encoding = encoding
        if encoding == "utf-8":
            detected_encoding = _detect_encoding(csv_path)
        
        # Read a small sample to sniff delimiter
        try:
            with open(csv_path, "rb") as f:
                sample = f.read(4096)
            delimiter = _sniff_delimiter(sample, default=default_delimiter)
        except Exception:
            delimiter = default_delimiter

        # Try to load with detected encoding, fallback to error handling
        try:
            df = pd.read_csv(csv_path, sep=delimiter, encoding=detected_encoding, low_memory=False, **read_csv_kwargs)
        except UnicodeDecodeError:
            # If detected encoding fails, try latin-1 as last resort
            df = pd.read_csv(csv_path, sep=delimiter, encoding='latin-1', low_memory=False, **read_csv_kwargs)
            detected_encoding = 'latin-1'
        
        dfs[csv_path.stem] = df
        print(f"Loaded {csv_path.name}: {len(df)} rows, {len(df.columns)} columns (delimiter='{delimiter}', encoding='{detected_encoding}')")

    if not dfs:
        print(f"No files matched pattern '{pattern}' in {data_folder}")

    return dfs


def describe_dataframe(df: pd.DataFrame, name: str = "DataFrame") -> None:
    """Print basic info for a DataFrame."""
    print(f"\n{'='*60}\n{name} Info\n{'='*60}")
    print(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns")
    print("\nColumns:")
    for i, col in enumerate(df.columns, 1):
        print(f"  {i}. {col}")
    print("\nDtypes:")
    print(df.dtypes)
    print("\nHead:")
    print(df.head())
    print("\nMissing values per column:")
    print(df.isnull().sum())


if __name__ == "__main__":
    # Example usage: load all CSVs in the local data folder
    dfs = load_csv_folder(Path(__file__).parent.parent / "data")
    for name, df in dfs.items():
        describe_dataframe(df, name)
