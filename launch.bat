@echo off
setlocal
cd /d "%~dp0"
title IRAH Services LLP - Digital Platform
echo ======================================================================
echo           IRAH SERVICES LLP - DIGITAL PLATFORM LAUNCHER
echo ======================================================================

where py >nul 2>&1 && (set "PY=py -3.11") || (set "PY=%LOCALAPPDATA%\Programs\Python\Python311\python.exe")
%PY% --version >nul 2>&1 || (
  echo Python 3.11 was not found. Install it from python.org and run this again.
  pause
  exit /b 1
)

%PY% -c "import reportlab, matplotlib, numpy" >nul 2>&1 || (
  echo Installing the PDF report libraries ^(one-time^)...
  %PY% -m pip install -r requirements.txt
)

rem One-time email setup. Reports are sent FROM a Gmail account you control TO the designated compliance desk.
rem Settings are saved to irah.env and reused on every start.
if exist irah.env goto :start
if defined IRAH_RESEND_API_KEY goto :start
if defined IRAH_GMAIL_APP_PASSWORD goto :start
echo.
echo ONE-TIME EMAIL SETUP - reports are emailed to designated compliance desk
echo Enter any Gmail account YOU control to send them from ^(a new throwaway Gmail is fine^).
echo It needs 2-Step Verification on, plus an App Password: myaccount.google.com/apppasswords
echo Press Enter on the first question to skip: reports will be saved on this PC but NOT emailed.
echo.
set "SENDER_GMAIL="
set /p SENDER_GMAIL=Sender Gmail address: 
if not defined SENDER_GMAIL goto :start
set "SENDER_PASS="
set /p SENDER_PASS=App Password ^(16 letters^): 
set "SENDER_PASS=%SENDER_PASS: =%"
>irah.env echo IRAH_SMTP_USER=%SENDER_GMAIL%
>>irah.env echo IRAH_GMAIL_APP_PASSWORD=%SENDER_PASS%
echo Saved to irah.env - you will not be asked again. Delete irah.env to change it.

:start
rem Stop any older IRAH server still holding port 8088 (python only), so the fresh settings are always used.
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8088 " ^| findstr LISTENING') do (
  tasklist /FI "PID eq %%p" | findstr /i "python" >nul && taskkill /F /PID %%p >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo.
echo Starting server...
start "IRAH Server" %PY% server.py 8088
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8088"
echo IRAH Services LLP is live at http://127.0.0.1:8088
echo Check the "IRAH Server" window: it should say "Report email: ENABLED".
echo To stop it, close the "IRAH Server" window.
pause
