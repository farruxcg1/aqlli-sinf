@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Aqlli sinf prototipi ishga tushmoqda...
echo Brauzerda http://localhost:8000 ochiladi. To'xtatish uchun shu oynani yoping.
start "" http://localhost:8000/
python -m http.server 8000
