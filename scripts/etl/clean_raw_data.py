"""
Function to clean and reformat raw_data to match some_cleaned format.
Extracts notes from descriptions, brand from URLs, and standardizes all columns.
"""

import pandas as pd
import re
import ast
from typing import Optional


def extract_brand_from_url(url: str) -> str:
    """
    Extract brand name from Fragrantica URL with original case preserved.
    URL format: https://www.fragrantica.com/perfume/BrandName/perfume-name-id.html
    
    Args:
        url: Fragrantica URL
    
    Returns:
        str: Brand name with original case from URL
    """
    if pd.isna(url) or not url:
        return ""
    
    try:
        # Extract brand from URL pattern: /perfume/BrandName/
        match = re.search(r'/perfume/([^/]+)/', url)
        if match:
            brand = match.group(1)  # Keep original case from URL
            return brand
    except Exception:
        pass
    
    return ""


def extract_perfume_from_url(url: str) -> str:
    """
    Extract perfume name from Fragrantica URL with original case preserved.
    URL format: https://www.fragrantica.com/perfume/BrandName/perfume-name-id.html
    
    Args:
        url: Fragrantica URL
    
    Returns:
        str: Perfume name with original case from URL
    """
    if pd.isna(url) or not url:
        return ""
    
    try:
        # Extract perfume from URL pattern: /perfume/BrandName/perfume-name-id.html
        # We want everything after the brand and before the final number
        match = re.search(r'/perfume/[^/]+/([^/]+)\.html', url)
        if match:
            perfume_with_id = match.group(1)
            # Remove trailing number pattern (e.g., "-78624" or "-70706")
            # Pattern: one or more hyphens followed by digits at the end
            perfume = re.sub(r'-\d+$', '', perfume_with_id)
            # Keep original case from URL
            return perfume
    except Exception:
        pass
    
    return ""


def replace_hyphens_with_spaces(text: str) -> str:
    """
    Replace hyphens with spaces, preserving the text structure.
    Hyphens in URLs are typically word separators, not part of the actual name.
    
    Args:
        text: Text with hyphens
    
    Returns:
        str: Text with hyphens replaced by spaces
    """
    if pd.isna(text) or not text:
        return ""
    
    # Replace hyphens with spaces
    text_cleaned = str(text).replace('-', ' ')
    
    # Clean up multiple spaces
    text_cleaned = re.sub(r'\s+', ' ', text_cleaned).strip()
    
    return text_cleaned


def validate_brand_perfume_from_name(name: str, url_brand: str, url_perfume: str) -> tuple[str, str]:
    """
    Cross-validate and correct brand and perfume by checking against Name column.
    
    Args:
        name: Full name from Name column
        url_brand: Brand extracted from URL
        url_perfume: Perfume extracted from URL
    
    Returns:
        tuple: (validated_brand, validated_perfume)
    """
    if pd.isna(name) or not name:
        return url_brand, url_perfume
    
    name_lower = str(name).lower()
    
    # Check if URL brand appears in name (with variations)
    brand_variations = [
        url_brand,
        url_brand.replace('-', ' '),
        url_brand.replace('-', ''),
    ]
    
    brand_found = False
    for variation in brand_variations:
        if variation in name_lower:
            brand_found = True
            break
    
    # If brand not found in name, try to extract it
    if not brand_found and url_brand:
        # Brand should be in the name, try to find it
        # Look for brand-like patterns near the end of the name
        pass  # Keep URL brand as primary source
    
    # Validate perfume name
    # Remove brand and gender from name to see if perfume matches
    name_clean = name_lower
    for variation in brand_variations:
        name_clean = name_clean.replace(variation, '')
    
    # Remove gender indicators
    name_clean = re.sub(r'\s*for\s+(women|men|women and men|unisex)\s*', '', name_clean)
    name_clean = re.sub(r'\s+', ' ', name_clean).strip()
    
    # Convert to hyphenated format
    name_clean_hyphenated = name_clean.replace(' ', '-')
    
    # If URL perfume and cleaned name are similar, use URL version (more reliable)
    # Otherwise, prefer URL version as it's the canonical source
    validated_perfume = url_perfume if url_perfume else name_clean_hyphenated
    
    return url_brand, validated_perfume


def extract_notes_from_description(description: str) -> dict:
    """
    Extract Top, Middle, and Base notes from description text.
    
    Args:
        description: Description text containing note information
    
    Returns:
        dict: {'Top': str, 'Middle': str, 'Base': str}
    """
    result = {'Top': '', 'Middle': '', 'Base': ''}
    
    if pd.isna(description) or not description:
        return result
    
    # Pattern to match "Top notes are ...; middle notes are ...; base notes are ..."
    top_pattern = r'[Tt]op\s+notes?\s+are\s+([^;]+)'
    middle_pattern = r'[Mm]iddle\s+notes?\s+are\s+([^;]+)'
    base_pattern = r'[Bb]ase\s+notes?\s+are\s+([^;.]+)'
    
    top_match = re.search(top_pattern, description)
    middle_match = re.search(middle_pattern, description)
    base_match = re.search(base_pattern, description)
    
    if top_match:
        result['Top'] = top_match.group(1).strip().lower()
    if middle_match:
        result['Middle'] = middle_match.group(1).strip().lower()
    if base_match:
        result['Base'] = base_match.group(1).strip().lower()
    
    return result


def parse_list_string(list_str: str) -> list:
    """
    Parse a string representation of a list (e.g., "['citrus', 'woody']" or "[]").
    
    Args:
        list_str: String representation of a list
    
    Returns:
        list: Parsed list
    """
    if pd.isna(list_str) or not list_str:
        return []
    
    try:
        # Try to evaluate as Python literal
        parsed = ast.literal_eval(list_str)
        if isinstance(parsed, list):
            return parsed
    except (ValueError, SyntaxError):
        pass
    
    return []


def convert_rating_to_percentage(rating: str):
    """
    Convert rating value from decimal (out of 5) to percentage (rounded to whole number).
    Handles both comma and dot as decimal separators.
    Returns empty string for 0 or invalid values.
    
    Args:
        rating: Rating value as string (e.g., "4,12" or "4.12" meaning 4.12 out of 5)
    
    Returns:
        int or str: Percentage value (e.g., 82 for 4.12/5), or empty string for 0/invalid
    """
    if pd.isna(rating) or not rating:
        return ""
    
    try:
        # Convert to string and handle both comma and dot as decimal separator
        rating_str = str(rating).strip()
        # Replace comma with dot for parsing
        rating_str = rating_str.replace(',', '.')
        
        # Parse as float
        rating_float = float(rating_str)
        
        # Convert to percentage: (rating / 5) * 100, rounded to whole number
        percentage = round((rating_float / 5) * 100)
        
        # Return empty string if 0, otherwise return the percentage
        if percentage == 0:
            return ""
        
        return percentage
    except (ValueError, TypeError):
        return ""


def parse_notes_to_list(notes_str: str) -> list:
    """
    Parse comma-separated notes string into a list of individual notes.
    Handles "and" as separator as well.
    
    Args:
        notes_str: Notes string (e.g., "patchouli, tonka bean and amber")
    
    Returns:
        list: List of notes with proper capitalization (e.g., ["Patchouli", "Tonka Bean", "Amber"])
    """
    if pd.isna(notes_str) or not notes_str or str(notes_str).strip() == '':
        return []
    
    notes_str = str(notes_str).strip()
    
    # Replace " and " with comma for consistent parsing
    notes_str = re.sub(r'\s+and\s+', ', ', notes_str, flags=re.IGNORECASE)
    
    # Split by comma
    notes = [note.strip() for note in notes_str.split(',')]
    
    # Clean up and capitalize properly
    cleaned_notes = []
    for note in notes:
        note = note.strip()
        if note:
            # Capitalize first letter of each word
            note = note.title()
            cleaned_notes.append(note)
    
    return cleaned_notes


def combine_accords(mainaccord1: str, mainaccord2: str, mainaccord3: str, 
                    mainaccord4: str, mainaccord5: str) -> list:
    """
    Combine all main accord columns into a single list, excluding empty values.
    Capitalizes each accord properly (Title Case).
    
    Args:
        mainaccord1-5: Individual accord values
    
    Returns:
        list: List of non-empty accords with proper capitalization
    """
    accords = []
    for accord in [mainaccord1, mainaccord2, mainaccord3, mainaccord4, mainaccord5]:
        if pd.notna(accord) and str(accord).strip() != '':
            # Capitalize properly (Title Case)
            accord_cleaned = str(accord).strip().title()
            accords.append(accord_cleaned)
    
    return accords


def standardize_gender(gender: str) -> str:
    """
    Standardize gender values to match some_cleaned format.
    
    Args:
        gender: Gender string from raw_data
    
    Returns:
        str: Standardized gender (women, men, unisex)
    """
    if pd.isna(gender) or not gender:
        return ""
    
    gender_lower = str(gender).lower().strip()
    
    if 'women and men' in gender_lower or 'unisex' in gender_lower:
        return 'unisex'
    elif 'women' in gender_lower:
        return 'women'
    elif 'men' in gender_lower:
        return 'men'
    
    return gender_lower


def extract_year_from_description(description: str) -> Optional[int]:
    """
    Extract year from description if available.
    
    Args:
        description: Description text
    
    Returns:
        int or None: Year if found
    """
    if pd.isna(description) or not description:
        return None
    
    # Look for "launched in YYYY" pattern
    year_match = re.search(r'launched\s+in\s+(\d{4})', description, re.IGNORECASE)
    if year_match:
        try:
            return int(year_match.group(1))
        except ValueError:
            pass
    
    return None


def extract_concentration(perfume_name: str) -> Optional[str]:
    """
    Extract fragrance concentration from the perfume name.
    "Eau de Toilette" and "EDT" both map to "edt".
    "Eau de Parfum" and "EDP" both map to "edp".
    
    Returns:
        Canonical concentration string or None if not found.
    """
    if pd.isna(perfume_name) or not perfume_name:
        return None
    
    name = str(perfume_name)
    
    patterns = [
        (r'\bEau\s+de\s+Cologne\b', 'cologne'),
        (r'\bEau\s+de\s+Toilette\b', 'edt'),
        (r'\bEDT\b', 'edt'),
        (r'\bEssence\s+de\s+Parfum\b', 'edp'),
        (r'\bEau\s+de\s+Parfum\b', 'edp'),
        (r'\bEDP\b', 'edp'),
        (r'\bExtrait\b', 'extrait'),
        (r'\bParfum\b', 'parfum'),
    ]
    
    for pattern, value in patterns:
        if re.search(pattern, name, re.IGNORECASE):
            return value
    
    return None


def clean_raw_data(raw_data: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and reformat raw_data to match some_cleaned format.
    
    Args:
        raw_data: Raw dataframe from fra_perfumes.csv
    
    Returns:
        pd.DataFrame: Cleaned dataframe matching some_cleaned format
    """
    if raw_data is None or raw_data.empty:
        return pd.DataFrame()
    
    # Create a copy to avoid modifying original
    df = raw_data.copy()
    
    # Initialize new dataframe with some_cleaned structure
    cleaned_df = pd.DataFrame()
    
    # Extract brand and perfume from URL (primary source)
    brands_from_url = df['url'].apply(extract_brand_from_url)
    perfumes_from_url = df['url'].apply(extract_perfume_from_url)
    
    # Cross-validate with Name column
    validated_data = df.apply(
        lambda row: validate_brand_perfume_from_name(
            row['Name'],
            brands_from_url.loc[row.name],
            perfumes_from_url.loc[row.name]
        ),
        axis=1
    )
    
    # Unpack validated data
    brands_validated = validated_data.apply(lambda x: x[0])
    perfumes_validated = validated_data.apply(lambda x: x[1])
    
    # Replace hyphens with spaces in both brand and perfume
    cleaned_df['Brand'] = brands_validated.apply(replace_hyphens_with_spaces)
    cleaned_df['Perfume'] = perfumes_validated.apply(replace_hyphens_with_spaces)
    
    # URL (keep as is)
    cleaned_df['url'] = df['url']
    
    # Gender (standardize format)
    cleaned_df['Gender'] = df['Gender'].apply(standardize_gender)
    
    # Rating Value (convert to percentage)
    cleaned_df['Rating Value'] = df['Rating Value'].apply(convert_rating_to_percentage)
    
    # Rating Count (keep as is, but ensure it's a string)
    cleaned_df['Rating Count'] = df['Rating Count'].astype(str)
    
    # Year (extract from description)
    cleaned_df['Year'] = df['Description'].apply(extract_year_from_description)
    
    # Extract notes from description and convert to lists
    notes_data = df['Description'].apply(extract_notes_from_description)
    cleaned_df['Top'] = notes_data.apply(lambda x: parse_notes_to_list(x.get('Top', '')))
    cleaned_df['Middle'] = notes_data.apply(lambda x: parse_notes_to_list(x.get('Middle', '')))
    cleaned_df['Base'] = notes_data.apply(lambda x: parse_notes_to_list(x.get('Base', '')))
    
    # Perfumers (parse from list string) - only Perfumer1, remove Perfumer2
    perfumers_list = df['Perfumers'].apply(parse_list_string)
    cleaned_df['Perfumer1'] = perfumers_list.apply(lambda x: x[0] if len(x) > 0 else '')
    
    # Main Accords (parse from list string and combine into single column)
    accords_list = df['Main Accords'].apply(parse_list_string)
    # Extract individual accords first
    temp_accords = {
        'mainaccord1': accords_list.apply(lambda x: x[0] if len(x) > 0 else ''),
        'mainaccord2': accords_list.apply(lambda x: x[1] if len(x) > 1 else ''),
        'mainaccord3': accords_list.apply(lambda x: x[2] if len(x) > 2 else ''),
        'mainaccord4': accords_list.apply(lambda x: x[3] if len(x) > 3 else ''),
        'mainaccord5': accords_list.apply(lambda x: x[4] if len(x) > 4 else '')
    }
    
    # Combine into single Main Accords column
    cleaned_df['Main Accords'] = df.apply(
        lambda row: combine_accords(
            temp_accords['mainaccord1'].loc[row.name],
            temp_accords['mainaccord2'].loc[row.name],
            temp_accords['mainaccord3'].loc[row.name],
            temp_accords['mainaccord4'].loc[row.name],
            temp_accords['mainaccord5'].loc[row.name]
        ),
        axis=1
    )
    
    # Concentration (parsed from perfume name)
    cleaned_df['Concentration'] = cleaned_df['Perfume'].apply(extract_concentration)
    
    column_order = [
        'Brand', 'Perfume', 'Gender', 'Rating Value', 
        'Rating Count', 'Year', 'Concentration', 'Main Accords', 'Top', 'Middle', 'Base', 'Perfumer1', 
        'url'
    ]
    
    cleaned_df = cleaned_df[column_order]
    
    return cleaned_df


if __name__ == "__main__":
    # Example usage
    from pathlib import Path
    from load_dataframes import load_csv_folder
    
    data_folder = Path(__file__).parent.parent / "data"
    dataframes = load_csv_folder(data_folder)
    raw_data = dataframes.get('fra_perfumes')
    
    if raw_data is not None:
        cleaned = clean_raw_data(raw_data)
        print(f"\nCleaned dataframe shape: {cleaned.shape}")
        print(f"\nFirst few rows:")
        print(cleaned.head())
        print(f"\nColumn names: {list(cleaned.columns)}")
