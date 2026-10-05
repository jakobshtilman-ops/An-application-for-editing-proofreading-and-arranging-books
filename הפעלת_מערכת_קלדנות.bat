@echo off
chcp 65001 >nul
title מערכת קלדנות לעורכי ספרים
echo פותח את מערכת קלדנות לעורכי ספרים בחלון אפליקציה ייעודי...

set "FILE_PATH=%~dp0index.html"

:: Check if Microsoft Edge is available and run in App mode (standalone window)
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    start msedge --app="file:///%FILE_PATH%"
    exit
)

:: Check if Google Chrome is available
where chrome >nul 2>nul
if %errorlevel% equ 0 (
    start chrome --app="file:///%FILE_PATH%"
    exit
)

:: Fallback to default browser
start "" "%FILE_PATH%"
exit
