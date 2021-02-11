@echo off
echo - exporting for linux (arch 32)
electron-packager . --platform=linux --arch=ia32 --overwrite 
echo - exporting for linux (arch 64)
electron-packager . --platform=linux --arch=x64 --overwrite
echo - exporting for windows (arch 32)
electron-packager . --platform=win32 --arch=ia32 --overwrite 
echo - exporting for windows (arch 64)
electron-packager . --platform=win32 --arch=x64 --overwrite 
echo - copying needed content to each one
copy "web" "blazebury-linux-ia32" >nul
copy "web" "blazebury-linux-x64" >nul
copy "web" "blazebury-win32-x64" >nul
copy "web" "blazebury-win32-ia32" >nul
cls
echo all good!
pause