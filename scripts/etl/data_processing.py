"""
Data Processing Script
Handles dataset download and cleaning.
Run this script to process raw data into cleaned format.
"""

from pathlib import Path
from load_dataframes import load_csv_folder
from clean_raw_data import clean_raw_data

try:
    from download_dataset import download_fragrance_dataset
    DOWNLOAD_AVAILABLE = True
except ImportError:
    DOWNLOAD_AVAILABLE = False

# Switch to control CSV export of cleaned data
EXPORT_CLEANED_CSV = True  # Set to False to disable CSV export

def process_data():
    """Main data processing function"""
    # Load CSV files as DataFrames
    data_folder = Path(__file__).parent.parent.parent / "data"
    dataframes = load_csv_folder(data_folder)
    
    # Store datasets with specified variable names
    some_cleaned = dataframes.get('fra_cleaned')
    raw_data = dataframes.get('fra_perfumes')
    
    # Clean raw_data to match some_cleaned format
    if raw_data is not None:
        raw_data_cleaned = clean_raw_data(raw_data)
    else:
        raw_data_cleaned = None
    
    # Display info
    if some_cleaned is not None:
        print(f"\nsome_cleaned loaded: {some_cleaned.shape[0]} rows × {some_cleaned.shape[1]} columns")
    
    if raw_data is not None:
        print(f"\nraw_data loaded: {raw_data.shape[0]} rows × {raw_data.shape[1]} columns")
    
    if raw_data_cleaned is not None:
        print(f"\nraw_data_cleaned: {raw_data_cleaned.shape[0]} rows × {raw_data_cleaned.shape[1]} columns")
        
        # Add searchable_text column for fast searching
        # Combine Brand and Perfume into a single lowercase searchable string
        brand_text = raw_data_cleaned['Brand'].astype(str).fillna('').str.lower()
        perfume_text = raw_data_cleaned['Perfume'].astype(str).fillna('').str.lower()
        raw_data_cleaned['searchable_text'] = (brand_text + ' ' + perfume_text).str.strip()
        
        # Export to CSV if switch is enabled
        if EXPORT_CLEANED_CSV:
            output_path = data_folder / "cleaned_data.csv"
            
            # Check if file is locked (e.g., by running webapp)
            import os
            if output_path.exists():
                try:
                    # Try to open file in append mode to check if it's locked
                    with open(output_path, 'a'):
                        pass
                except PermissionError:
                    print(f"\n⚠ Warning: Cannot write to {output_path}")
                    print("   The file may be open in another program (e.g., Excel) or locked by the webapp.")
                    print("   Please close the webapp and any programs using this file, then try again.")
                    print("   Alternatively, you can manually delete the file and run this script again.")
                    return raw_data_cleaned
            
            # Use comma delimiter for webapp compatibility
            # Convert lists to string representation for CSV storage
            df_export = raw_data_cleaned.copy()
            for col in ['Top', 'Middle', 'Base', 'Main Accords']:
                if col in df_export.columns:
                    df_export[col] = df_export[col].apply(lambda x: str(x) if isinstance(x, list) else x)
            
            try:
                df_export.to_csv(output_path, sep=',', index=False, encoding='utf-8')
                print(f"\nExported cleaned data to: {output_path}")
                print(f"Added 'searchable_text' column for optimized searching")
            except PermissionError as e:
                print(f"\n⚠ Error: Cannot write to {output_path}")
                print("   The file may be open in another program or locked by the webapp.")
                print("   Please close the webapp (Ctrl+C in the terminal running it) and try again.")
                print(f"   Error details: {e}")
                return raw_data_cleaned
        else:
            print("\n(CSV export disabled - set EXPORT_CLEANED_CSV = True to enable)")
    
    return raw_data_cleaned

if __name__ == "__main__":
    process_data()
