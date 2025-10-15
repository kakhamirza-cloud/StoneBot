@echo off
echo Stopping Spark Bot...
echo.

REM Kill any Node.js processes running the bot
taskkill /f /im node.exe >nul 2>&1

echo Spark Bot stopped.
pause





