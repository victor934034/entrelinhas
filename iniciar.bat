@echo off
cd /d "%~dp0"
title entre linhas
start "" http://localhost:3000
node server.js
pause
