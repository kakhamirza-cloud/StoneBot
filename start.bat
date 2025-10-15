@echo off
echo Starting Spark Bot...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if .env file exists
if not exist ".env" (
    echo Warning: .env file not found
    echo Please create .env file based on env.example
    echo.
)

REM Build the project
echo Building project...
npm run build
if %errorlevel% neq 0 (
    echo Error: Failed to build project
    pause
    exit /b 1
)

REM Register commands
echo Registering slash commands...
npm run register-commands
if %errorlevel% neq 0 (
    echo Warning: Failed to register commands
    echo You may need to register them manually
    echo.
)

REM Start the bot
echo Starting Spark Bot...
echo Press Ctrl+C to stop the bot
echo.
npm start

pause





