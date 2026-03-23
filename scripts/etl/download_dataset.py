"""
Function to download Kaggle dataset and save CSV files to project data folder
"""

import kagglehub
import shutil
from pathlib import Path


def download_fragrance_dataset(save_path: str = None) -> dict:
    """
    Download the Fragrantica fragrance dataset from Kaggle and save CSV files.
    
    Args:
        save_path (str, optional): Path to save the CSV files. 
                                  Defaults to 'data' folder in project root.
    
    Returns:
        dict: Dictionary containing paths to downloaded CSV files
    """
    # Set default save path to 'data' folder in project root
    if save_path is None:
        # Get the project root (parent of functions folder)
        project_root = Path(__file__).parent.parent
        save_path = project_root / "data"
    else:
        save_path = Path(save_path)
    
    # Create data directory if it doesn't exist
    save_path.mkdir(parents=True, exist_ok=True)
    
    print(f"Downloading dataset from Kaggle...")
    
    # Download latest version of the dataset
    dataset_path = kagglehub.dataset_download("olgagmiufana1/fragrantica-com-fragrance-dataset")
    
    print(f"Dataset downloaded to: {dataset_path}")
    
    # Find all CSV files in the downloaded dataset
    csv_files = list(Path(dataset_path).glob("*.csv"))
    
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in dataset at {dataset_path}")
    
    # Copy CSV files to the save_path
    saved_files = {}
    for csv_file in csv_files:
        destination = save_path / csv_file.name
        shutil.copy2(csv_file, destination)
        saved_files[csv_file.name] = str(destination)
        print(f"Saved: {csv_file.name} -> {destination}")
    
    print(f"\nAll CSV files saved to: {save_path}")
    
    return {
        "dataset_path": str(dataset_path),
        "save_path": str(save_path),
        "csv_files": saved_files
    }


if __name__ == "__main__":
    # Run the download when script is executed directly
    result = download_fragrance_dataset()
    print("\nDownload complete!")
    print(f"CSV files saved to: {result['save_path']}")
