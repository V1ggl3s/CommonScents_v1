"""
Main application file for CommonScents - Fragrance Notes Breakdown Webapp
"""

from pathlib import Path
from functions.load_dataframes import load_csv_folder
from functions.clean_raw_data import clean_raw_data

# Optional import for dataset download (only needed if downloading new data)
try:
    from functions.download_dataset import download_fragrance_dataset
    DOWNLOAD_AVAILABLE = True
except ImportError:
    DOWNLOAD_AVAILABLE = False

# Switch to control CSV export of cleaned data
EXPORT_CLEANED_CSV = True  # Set to False to disable CSV export

# Load CSV files as DataFrames
data_folder = Path(__file__).parent / "data"
dataframes = load_csv_folder(data_folder)

# Store datasets with specified variable names
some_cleaned = dataframes.get('fra_cleaned')
raw_data = dataframes.get('fra_perfumes')

# Clean raw_data to match some_cleaned format
if raw_data is not None:
    raw_data_cleaned = clean_raw_data(raw_data)
else:
    raw_data_cleaned = None

# Main application entry point will be implemented here

if __name__ == "__main__":
    # Example: Download the fragrance dataset
    # Uncomment the line below to download the dataset
    # result = download_fragrance_dataset()
    # print(f"Dataset downloaded! CSV files saved to: {result['save_path']}")
    
    # Display loaded dataframes info
    if some_cleaned is not None:
        print(f"\nsome_cleaned loaded: {some_cleaned.shape[0]} rows × {some_cleaned.shape[1]} columns")
        print(f"Columns: {list(some_cleaned.columns)}")
    
    if raw_data is not None:
        print(f"\nraw_data loaded: {raw_data.shape[0]} rows × {raw_data.shape[1]} columns")
        print(f"Columns: {list(raw_data.columns)}")
    
    if raw_data_cleaned is not None:
        print(f"\nraw_data_cleaned: {raw_data_cleaned.shape[0]} rows × {raw_data_cleaned.shape[1]} columns")
        print(f"Columns: {list(raw_data_cleaned.columns)}")
        print(f"\nFirst few rows of cleaned data:")
        print(raw_data_cleaned.head())
        
        # Export to CSV if switch is enabled
        if EXPORT_CLEANED_CSV:
            output_path = data_folder / "cleaned_data.csv"
            # Use semicolon delimiter to match some_cleaned format
            raw_data_cleaned.to_csv(output_path, sep=',', index=False, encoding='utf-8')
            print(f"\n✓ Exported cleaned data to: {output_path}")
        else:
            print("\n(CSV export disabled - set EXPORT_CLEANED_CSV = True to enable)")


    
