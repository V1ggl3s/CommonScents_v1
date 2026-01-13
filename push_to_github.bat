@echo off
REM Batch script to push CommonScents_v1 to GitHub
REM Run this script from the CommonScents_v1 folder

cd /d "C:\Users\vigne\Documents\Coding Projects\CommonScents_v1"

echo Initializing git repository...
git init

echo Adding files to staging...
git add .

echo Creating initial commit...
git commit -m "Initial project setup"

echo Setting branch to main...
git branch -M main

echo Adding remote origin...
git remote add origin https://github.com/V1ggl3s/CommonScents_v1.git

echo Pushing to GitHub...
git push -u origin main

echo Done! Your project has been pushed to GitHub.
pause
