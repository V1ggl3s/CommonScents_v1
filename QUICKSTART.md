# Quick Start Guide

## Getting Started with CommonScents Webapp

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Process Your Data (if not already done)
```bash
python data_processing.py
```
This will create `data/cleaned_data.csv` which the webapp uses.

### Step 3: Run the Webapp
```bash
python webapp.py
```

### Step 4: Open in Browser
Navigate to: `http://localhost:5000`

## How to Use

1. **Search**: Type a brand or perfume name in the search box
2. **Select**: Click on a suggestion from the dropdown
3. **View Details**: See all fragrance information on the detail page

## Project Workflow

1. **Data Download** → `functions/download_dataset.py` (downloads from Kaggle)
2. **Data Cleaning** → `data_processing.py` (processes raw CSV into cleaned format)
3. **Web Application** → `webapp.py` (Flask webapp for searching and viewing)

## File Structure

- `data_processing.py` - Run this to clean your data
- `webapp.py` - Run this to start the webapp
- `functions/` - Utility functions for data processing
- `templates/` - HTML templates
- `static/` - CSS and JavaScript files
- `data/` - CSV data files
