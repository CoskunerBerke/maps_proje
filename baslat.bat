@echo off
title Eksik Web - Web Sitesi Bulucu
echo ===================================================
echo   Eksik Web Uygulamasi Baslatiliyor...
echo   Lutfen bu pencereyi kapatmayin.
echo ===================================================
echo.

:: Tarayicida uygulamayi otomatik olarak ac
start http://localhost:5173

:: Uygulamayi dev modunda calistir
npm run dev

pause
