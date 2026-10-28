@echo off
title Pushing Motion Studio to GitHub...
cd /d "%~dp0"
echo ==============================================================
echo   Pushing Motion Studio to https://github.com/aaRon1105-11/motion-
echo ==============================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Repository pushed to GitHub!
) else (
    echo [NOTE] If you need to authenticate, sign in via the browser popup or enter your GitHub Personal Access Token.
)
echo.
pause
