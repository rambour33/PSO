@echo off
title PSmash - Smash Bros Ultimate
echo.
echo  ====================================
echo   PSmash - Smash Bros Ultimate
echo  ====================================
echo.
where node >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js non installe. Telecharge sur https://nodejs.org
    pause & exit /b 1
)
node --version
if not exist "node_modules\" (
    echo Installation des dependances...
    npm install
)
echo.
echo  Scoreboard OBS : http://localhost:3002/overlay
echo  Stage Veto OBS : http://localhost:3002/stageveto
echo  Controle       : http://localhost:3002/control
echo.
start "" "http://localhost:3002/control"
node server.js
pause
