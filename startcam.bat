@echo off

REM Naviguer vers le dossier frontend et démarrer npm start
cd /d "D:camera_management\frontend"
start cmd /k "npm start"

REM Naviguer vers le dossier backend et démarrer node server.js
cd /d ".."

REM Naviguer vers le dossier backend et démarrer node server.js
cd /d "D:camera_management\backend"
start cmd /k "node server.js"


