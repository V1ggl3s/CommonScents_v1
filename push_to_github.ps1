# PowerShell script to push CommonScents_v1 to GitHub
# Run this script from the CommonScents_v1 folder

# Navigate to the project directory
Set-Location "C:\Users\vigne\Documents\Coding Projects\CommonScents_v1"

# Initialize git repository
Write-Host "Initializing git repository..." -ForegroundColor Green
git init

# Add all files
Write-Host "Adding files to staging..." -ForegroundColor Green
git add .

# Create initial commit
Write-Host "Creating initial commit..." -ForegroundColor Green
git commit -m "Initial project setup"

# Set branch to main
Write-Host "Setting branch to main..." -ForegroundColor Green
git branch -M main

# Add remote origin
Write-Host "Adding remote origin..." -ForegroundColor Green
git remote add origin https://github.com/V1ggl3s/CommonScents_v1.git

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Green
git push -u origin main

Write-Host "Done! Your project has been pushed to GitHub." -ForegroundColor Green
