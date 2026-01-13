# CommonScents - Fragrance Notes Breakdown Webapp

A web application centered around providing detailed breakdowns of fragrance notes for a comprehensive list of fragrances by various manufacturers and producers.

## Features

- Complete fragrance database with detailed note breakdowns
- Visual graphics for each fragrance
- Best time of day recommendations
- Seasonal wearing recommendations
- Similar fragrance comparisons
- Vibe and mood descriptions

## Project Structure

```
CommonScents_v1/
├── app.py                 # Main application entry point
├── functions/             # Reusable utility functions
├── requirements.txt       # Python dependencies
└── README.md             # Project documentation
```

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

## Technology Stack

- Python
- Data processing and cleaning libraries (pandas, numpy)
- Web framework (to be determined)

## GitHub Setup

**Repository:** https://github.com/V1ggl3s/CommonScents_v1.git

### Quick Setup (Recommended)

**To push this project to GitHub, run these commands in PowerShell or Command Prompt:**

```powershell
cd "C:\Users\vigne\Documents\Coding Projects\CommonScents_v1"
git init
git add .
git commit -m "Initial project setup"
git branch -M main
git remote add origin https://github.com/V1ggl3s/CommonScents_v1.git
git push -u origin main
```

**Or use the provided scripts:**
- Run `push_to_github.ps1` in PowerShell
- Or run `push_to_github.bat` in Command Prompt

### Alternative Options

### Option 2: Push to a Subfolder in an Existing Repository

If you want this project as a folder inside an existing repository:

1. **Clone your existing repository** (if you don't have it locally):
```bash
cd "C:\Users\vigne\Documents\Coding Projects"
git clone https://github.com/YOUR_USERNAME/YOUR_EXISTING_REPO.git
```

2. **Copy the CommonScents_v1 folder into the cloned repository**:
```bash
# Copy the entire CommonScents_v1 folder into your existing repo folder
```

3. **Navigate to your existing repository and commit**:
```bash
cd YOUR_EXISTING_REPO
git add CommonScents_v1/
git commit -m "Add CommonScents_v1 project"
git push origin main
```

### Option 3: Add as Subfolder Using Git Subtree (Advanced)

If you want to add it to an existing repo without cloning:
```bash
cd "C:\Users\vigne\Documents\Coding Projects\CommonScents_v1"
git init
git add .
git commit -m "Initial project setup"

# Then in your existing repository:
cd YOUR_EXISTING_REPO
git remote add commonscents-v1 "C:\Users\vigne\Documents\Coding Projects\CommonScents_v1"
git fetch commonscents-v1
git merge -s ours --no-commit commonscents-v1/main
git read-tree --prefix=CommonScents_v1/ -u commonscents-v1/main
git commit -m "Add CommonScents_v1 as subfolder"
git push origin main
```

## Development

This project is in initial setup phase. Core functionality will be implemented in subsequent development phases.
