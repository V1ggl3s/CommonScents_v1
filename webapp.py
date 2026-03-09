"""
Flask Web Application for CommonScents Fragrance Database
Main entry point for the webapp
"""

from flask import Flask, render_template, request, jsonify
from pathlib import Path
import pandas as pd
import re
from functions.load_dataframes import load_csv_folder
from functions.clean_raw_data import clean_raw_data

# Try to import rapidfuzz for fuzzy matching, fallback to simple matching if not available
try:
    from rapidfuzz import fuzz, process
    FUZZY_AVAILABLE = True
except ImportError:
    FUZZY_AVAILABLE = False
    print("Warning: rapidfuzz not installed. Install with 'pip install rapidfuzz' for typo-tolerant search.")

app = Flask(__name__)

# Global variable to store fragrance database
fragrance_db = None

def load_fragrance_database():
    """Load and prepare fragrance database"""
    global fragrance_db
    
    data_folder = Path(__file__).parent / "data"
    
    # Try to load cleaned data first
    cleaned_path = data_folder / "cleaned_data.csv"
    if cleaned_path.exists():
        print("Loading cleaned_data.csv...")
        fragrance_db = pd.read_csv(cleaned_path, sep=',', encoding='utf-8', low_memory=False)
        print(f"Loaded {len(fragrance_db)} fragrances from cleaned_data.csv")
    else:
        # If cleaned data doesn't exist, process raw data
        print("cleaned_data.csv not found. Processing raw data...")
        dataframes = load_csv_folder(data_folder)
        raw_data = dataframes.get('fra_perfumes')
        
        if raw_data is not None:
            fragrance_db = clean_raw_data(raw_data)
            # Save for future use (convert lists to strings for CSV)
            df_export = fragrance_db.copy()
            for col in ['Top', 'Middle', 'Base', 'Main Accords']:
                if col in df_export.columns:
                    df_export[col] = df_export[col].apply(lambda x: str(x) if isinstance(x, list) else x)
            df_export.to_csv(cleaned_path, sep=',', index=False, encoding='utf-8')
            print(f"Processed and saved {len(fragrance_db)} fragrances")
        else:
            fragrance_db = pd.DataFrame()
            print("No data found!")
    
    # Convert lists stored as strings back to lists
    if not fragrance_db.empty:
        for col in ['Top', 'Middle', 'Base', 'Main Accords']:
            if col in fragrance_db.columns:
                fragrance_db[col] = fragrance_db[col].apply(parse_list_string)
        
        # Ensure searchable_text column exists (create if missing for backward compatibility)
        if 'searchable_text' not in fragrance_db.columns:
            brand_text = fragrance_db['Brand'].astype(str).fillna('').str.lower()
            perfume_text = fragrance_db['Perfume'].astype(str).fillna('').str.lower()
            fragrance_db['searchable_text'] = (brand_text + ' ' + perfume_text).str.strip()
            print("✓ Created 'searchable_text' column for optimized searching")
    
    print(f"✓ Database loaded with {len(fragrance_db)} fragrances")

def parse_list_string(value):
    """Parse string representation of list back to actual list"""
    import ast
    import numpy as np
    
    if value is None:
        return []
    
    # Safe check for NaN - only on scalars
    try:
        if not isinstance(value, str) and not isinstance(value, list):
            # Check if it's a scalar that's NaN
            if hasattr(value, '__len__') and not isinstance(value, str):
                # It's array-like, convert to list first
                value = list(value)
            elif isinstance(value, (int, float, np.number)):
                # Scalar number - safe to check
                if pd.isna(value):
                    return []
    except (ValueError, TypeError):
        pass
    
    if value == '' or str(value).lower() == 'nan':
        return []
    
    try:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            # Handle string representations of lists
            value = value.strip()
            if value == '' or value == '[]':
                return []
            # Try to parse as Python literal
            parsed = ast.literal_eval(value)
            if isinstance(parsed, list):
                return parsed
        return []
    except (ValueError, SyntaxError, TypeError):
        # If parsing fails, return empty list
        return []

# Load database on startup
load_fragrance_database()

def tokenize_query(query: str) -> list[str]:
    """
    Tokenize search query into words, removing filler words.
    
    Args:
        query: Search query string
    
    Returns:
        list: List of meaningful search terms
    """
    # Common filler words to ignore
    filler_words = {
        'perfume', 'perfumes', 'fragrance', 'fragrances', 'cologne', 'colognes',
        'the', 'a', 'an', 'and', 'or', 'of', 'for', 'in', 'on', 'at', 'to',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might'
    }
    
    # Tokenize: split on whitespace and punctuation, keep only alphanumeric
    tokens = re.findall(r'\b\w+\b', query.lower())
    
    # Remove filler words and very short words (1 character)
    meaningful_tokens = [token for token in tokens if token not in filler_words and len(token) > 1]
    
    return meaningful_tokens if meaningful_tokens else [query.lower()]

def calculate_relevance_score_fast(query_lower: str, query_tokens: list[str], searchable_text: str) -> float:
    """
    Fast relevance scoring using pre-computed searchable_text.
    
    Args:
        query_lower: Lowercase query string
        query_tokens: List of meaningful search terms
        searchable_text: Pre-computed searchable text (brand + perfume, lowercase)
    
    Returns:
        float: Relevance score (higher = more relevant)
    """
    if not searchable_text or not query_tokens:
        return 0.0
    
    score = 0.0
    matched_tokens = 0
    
    # Exact phrase match (highest priority)
    if query_lower in searchable_text:
        score += 100.0
    
    # Check each token
    for token in query_tokens:
        # Exact word match (high score) - using 'in' for speed, word boundaries checked separately
        if f' {token} ' in f' {searchable_text} ' or searchable_text.startswith(token + ' ') or searchable_text.endswith(' ' + token):
            score += 10.0
            matched_tokens += 1
        # Partial match (lower score)
        elif token in searchable_text:
            score += 3.0
            matched_tokens += 1
    
    # Bonus for matching all tokens
    if matched_tokens == len(query_tokens):
        score += 20.0
    
    # Penalty for partial matches
    if matched_tokens < len(query_tokens):
        score *= 0.7
    
    # Bonus for query starting the searchable text
    if query_tokens and searchable_text.startswith(query_tokens[0]):
        score += 5.0
    
    return score

@app.route('/')
def index():
    """Main search page"""
    return render_template('index.html')

@app.route('/api/search', methods=['GET'])
def search():
    """Fast API endpoint for search suggestions with fuzzy matching"""
    query = request.args.get('q', '').strip()
    
    if not query or len(query) < 2:
        return jsonify([])
    
    if fragrance_db is None or fragrance_db.empty:
        return jsonify([])
    
    try:
        query_lower = query.lower()
        query_tokens = tokenize_query(query)
        
        # Fast vectorized filtering using searchable_text column
        # First, get all rows where searchable_text contains any query token
        if 'searchable_text' in fragrance_db.columns:
            # Use vectorized pandas operations for initial filtering (very fast)
            mask = pd.Series([False] * len(fragrance_db), index=fragrance_db.index)
            for token in query_tokens:
                mask |= fragrance_db['searchable_text'].str.contains(token, na=False, case=False)
            
            # Get filtered results
            filtered_df = fragrance_db[mask].copy()
        else:
            # Fallback if searchable_text doesn't exist
            brand_mask = fragrance_db['Brand'].astype(str).fillna('').str.lower().str.contains(query_lower, na=False)
            perfume_mask = fragrance_db['Perfume'].astype(str).fillna('').str.lower().str.contains(query_lower, na=False)
            filtered_df = fragrance_db[brand_mask | perfume_mask].copy()
        
        if filtered_df.empty:
            # If no exact matches, try fuzzy matching if available
            if FUZZY_AVAILABLE and len(query) >= 3:
                # Use fuzzy matching on searchable_text with indices
                searchable_dict = {idx: text for idx, text in zip(fragrance_db.index, fragrance_db['searchable_text'].fillna(''))}
                # Get top 20 fuzzy matches with their original indices
                fuzzy_matches = process.extract(
                    query_lower,
                    searchable_dict,
                    limit=20,
                    scorer=fuzz.partial_ratio,
                    score_cutoff=60  # Minimum 60% similarity
                )
                
                if fuzzy_matches:
                    # Extract indices from fuzzy matches
                    matched_indices = [match[2] for match in fuzzy_matches]  # match is (text, score, index)
                    filtered_df = fragrance_db.loc[matched_indices].copy()
                else:
                    return jsonify([])
            else:
                return jsonify([])
        
        # Calculate scores only for filtered results (much faster)
        scores = []
        for idx, row in filtered_df.iterrows():
            searchable_text = row.get('searchable_text', '')
            if not searchable_text:
                # Fallback: create searchable text on the fly
                brand = str(row.get('Brand', '')).lower()
                perfume = str(row.get('Perfume', '')).lower()
                searchable_text = f"{brand} {perfume}".strip()
            
            score = calculate_relevance_score_fast(query_lower, query_tokens, searchable_text)
            
            # Add fuzzy score bonus if available
            if FUZZY_AVAILABLE and score > 0:
                fuzzy_score = fuzz.partial_ratio(query_lower, searchable_text)
                # Normalize fuzzy score (0-100) to add as bonus (0-10 points)
                score += (fuzzy_score / 10.0)
            
            scores.append({
                'id': int(idx),
                'brand': str(row.get('Brand', '')) if pd.notna(row.get('Brand')) else '',
                'perfume': str(row.get('Perfume', '')) if pd.notna(row.get('Perfume')) else '',
                'display': f"{row.get('Brand', '')} - {row.get('Perfume', '')}",
                'score': score
            })
        
        # Sort by score (descending) and limit to top 15
        scores.sort(key=lambda x: x['score'], reverse=True)
        suggestions = scores[:15]
        
        # Remove score from response
        for suggestion in suggestions:
            del suggestion['score']
        
        return jsonify(suggestions)
    except Exception as e:
        import traceback
        print(f"Search error: {e}")
        traceback.print_exc()
        return jsonify([])

@app.route('/fragrance/<int:fragrance_id>')
def fragrance_detail(fragrance_id):
    """Display individual fragrance details"""
    if fragrance_db is None or fragrance_db.empty:
        return "Database not loaded", 404
    
    if fragrance_id < 0 or fragrance_id >= len(fragrance_db):
        return "Fragrance not found", 404
    
    try:
        # Get the row as a Series first, then convert to dict
        row = fragrance_db.iloc[fragrance_id]
        fragrance = {}
        
        # Safely extract each value, handling NaN and array issues
        for key in row.index:
            value = row[key]
            
            # Check if value is None first
            if value is None:
                fragrance[key] = None
            # Check if it's a scalar (single value) before using pd.isna
            elif not hasattr(value, '__len__') or isinstance(value, str):
                # It's a scalar or string - safe to use pd.isna
                try:
                    if pd.isna(value):
                        fragrance[key] = None
                    elif isinstance(value, str):
                        if value.strip() == '' or value.lower() == 'nan':
                            fragrance[key] = None
                        else:
                            fragrance[key] = value
                    elif isinstance(value, (int, float)):
                        fragrance[key] = value
                    else:
                        fragrance[key] = str(value)
                except (ValueError, TypeError):
                    # If pd.isna fails, just convert to string
                    fragrance[key] = str(value) if value is not None else None
            else:
                # It's an array/list-like - convert to list or string
                try:
                    if isinstance(value, list):
                        fragrance[key] = value
                    else:
                        # Convert array-like to list
                        fragrance[key] = list(value) if hasattr(value, '__iter__') else str(value)
                except:
                    fragrance[key] = str(value)
        
        # Ensure lists are properly formatted
        for key in ['Top', 'Middle', 'Base', 'Main Accords']:
            if key in fragrance:
                fragrance[key] = parse_list_string(fragrance[key])
        
        # Ensure string values are properly formatted (after list parsing)
        for key in ['Brand', 'Perfume', 'Gender', 'Perfumer1']:
            if key in fragrance:
                if fragrance[key] is None:
                    fragrance[key] = ''
                elif isinstance(fragrance[key], str):
                    if fragrance[key].strip() == '':
                        fragrance[key] = ''
                else:
                    fragrance[key] = str(fragrance[key])
        
        # Format Year as string without decimals
        if 'Year' in fragrance:
            year_value = fragrance['Year']
            if year_value is not None and year_value != '':
                try:
                    # Convert to int first to remove decimals, then to string
                    if isinstance(year_value, (int, float)):
                        fragrance['Year'] = str(int(year_value))
                    elif isinstance(year_value, str):
                        # Try to parse and reformat
                        year_float = float(year_value)
                        fragrance['Year'] = str(int(year_float))
                    else:
                        fragrance['Year'] = str(year_value)
                except (ValueError, TypeError):
                    # If conversion fails, keep as string or set to None
                    fragrance['Year'] = str(year_value) if year_value else None
            else:
                fragrance['Year'] = None
        
        return render_template('fragrance_detail.html', fragrance=fragrance)
    except Exception as e:
        import traceback
        print(f"Error loading fragrance {fragrance_id}: {e}")
        traceback.print_exc()
        return f"Error loading fragrance: {str(e)}", 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
