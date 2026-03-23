"""
Vectorized inference of best_time (day/night) and best_season from fragrance notes and accords.
Uses pandas string operations on entire columns for speed — handles 70k rows in seconds.
"""

import pandas as pd

SEASON_KEYWORDS = {
    "summer":  ["citrus", "aquatic", "green", "ozonic", "tropical", "fresh", "marine", "water"],
    "winter":  ["vanilla", "warm spicy", "amber", "woody", "sweet", "musk", "leather", "tobacco", "oud"],
    "spring":  ["floral", "rose", "white floral", "fruity", "lily", "peony", "cherry blossom"],
    "fall":    ["warm spicy", "amber", "woody", "earthy", "mossy", "patchouli", "cinnamon", "nutmeg"],
}

TIME_KEYWORDS = {
    "day":   ["citrus", "green", "fresh", "aquatic", "ozonic", "marine", "aromatic", "herbal"],
    "night": ["amber", "vanilla", "musk", "warm spicy", "sweet", "leather", "oud", "tobacco", "animalic"],
}

NOTE_COLS = ["Main Accords", "Top", "Middle", "Base"]


def _make_combined_text(df: pd.DataFrame) -> pd.Series:
    """Concatenate all note columns into one lowercased text series."""
    parts = []
    for col in NOTE_COLS:
        if col in df.columns:
            parts.append(
                df[col].apply(
                    lambda x: " ".join(x).lower() if isinstance(x, list) else (str(x).lower() if pd.notna(x) else "")
                )
            )
    if not parts:
        return pd.Series([""] * len(df), index=df.index)
    combined = parts[0]
    for p in parts[1:]:
        combined = combined + " " + p
    return combined


def _score_keywords(text: pd.Series, keywords: list[str]) -> pd.Series:
    """Return a numeric score per row: count of keyword matches in the text."""
    score = pd.Series(0.0, index=text.index)
    for kw in keywords:
        score += text.str.contains(kw, na=False, regex=False).astype(float)
    return score


def add_inferred_metadata(df: pd.DataFrame) -> pd.DataFrame:
    """Add best_season (list, up to 2) and best_time (list) columns to df. Fast vectorized."""
    df = df.copy()
    text = _make_combined_text(df)

    # --- Season ---
    season_scores = {s: _score_keywords(text, kws) for s, kws in SEASON_KEYWORDS.items()}

    def pick_seasons(idx):
        scores = {s: season_scores[s][idx] for s in SEASON_KEYWORDS}
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return [s for s, v in ranked[:2] if v > 0]

    df["best_season"] = [pick_seasons(i) for i in df.index]

    # --- Time ---
    day_score = _score_keywords(text, TIME_KEYWORDS["day"])
    night_score = _score_keywords(text, TIME_KEYWORDS["night"])

    def pick_time(idx):
        d = day_score[idx]
        n = night_score[idx]
        if d == 0 and n == 0:
            return []
        if d > 0 and n > 0:
            higher = max(d, n)
            lower = min(d, n)
            if lower >= higher * 0.6:
                return ["day", "night"]
        if d > n:
            return ["day"]
        if n > d:
            return ["night"]
        return ["day", "night"]

    df["best_time"] = [pick_time(i) for i in df.index]

    return df


if __name__ == "__main__":
    from pathlib import Path
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    from load_dataframes import load_csv_folder
    from clean_raw_data import clean_raw_data

    data_folder = Path(__file__).parent.parent.parent / "data"
    dataframes = load_csv_folder(data_folder)
    raw_data = dataframes.get("fra_perfumes")

    if raw_data is not None:
        cleaned = clean_raw_data(raw_data)
        import time
        t0 = time.time()
        enriched = add_inferred_metadata(cleaned)
        print(f"Inference done in {time.time() - t0:.1f}s")
        sample = enriched[["Brand", "Perfume", "best_season", "best_time"]].head(10)
        for _, row in sample.iterrows():
            print(f"  {row['Brand']} - {row['Perfume']}: season={row['best_season']}, time={row['best_time']}")
