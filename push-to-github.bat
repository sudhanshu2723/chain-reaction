@echo off
echo ========================================
echo   Push to GitHub
echo ========================================
echo.
echo Your GitHub username: sudhanshu2723
echo Repository: chain-reaction-game
echo.
echo Make sure you have created the repository on GitHub first!
echo Go to: https://github.com/new
echo.
pause
echo.
echo Adding remote...
git remote add origin https://github.com/sudhanshu2723/chain-reaction-game.git
echo.
echo Renaming branch to main...
git branch -M main
echo.
echo Pushing to GitHub...
echo (You may need to enter your GitHub credentials)
git push -u origin main
echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo Next steps:
echo 1. Go to: https://render.com
echo 2. Sign up with GitHub
echo 3. Create Web Service
echo 4. Connect your repository
echo 5. Deploy!
echo.
pause
