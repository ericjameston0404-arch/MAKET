@echo off
chcp 65001 >nul
title SMART GREENHOUSE - Офлайн 3D Симулятор
color 0b
cd /d "%~dp0"

echo ===================================================================
echo     🌱 SMART GREENHOUSE: БОЛАШАҚТЫҢ АВТОНОМДЫ ЖЫЛЫЖАЙЫ
echo             3D Цифрлық Егіз (Digital Twin Simulator)
echo ===================================================================
echo.
echo Сервер іске қосылуда, күте тұрыңыз...
echo.

python -u server.py
if %errorlevel% neq 0 (
    echo Python арқылы іске қосу мүмкін болмады.
    echo Тікелей index.html браузерде ашылады...
    start index.html
)
pause
