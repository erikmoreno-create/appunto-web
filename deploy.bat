@echo off
echo.
echo  Subiendo cambios a Vercel...
echo  --------------------------------

cd /d "%~dp0"

git add .
git commit -m "Update"
git push

echo.
echo  Listo. Vercel desplegara en ~1 minuto.
echo  URL: https://appunto-web.vercel.app
echo.
pause
