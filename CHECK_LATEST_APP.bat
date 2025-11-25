@echo off
echo Checking latest application analysis...
echo.
timeout /t 2 /nobreak >nul
curl -s http://localhost:8000/api/applications > temp_apps.json
echo Latest applications retrieved
echo.
echo Checking if AI was used...
type temp_apps.json
del temp_apps.json
pause
