@echo off
REM ============================================================
REM  Rebuild "Price Editor.exe" from price_editor.py
REM  Only needed if you change price_editor.py. The exe is
REM  already built and ready to use.
REM
REM  Requires: Python + PyInstaller
REM     pip install pyinstaller
REM ============================================================
cd /d "%~dp0"
echo Building Price Editor.exe ...
python -m PyInstaller --onefile --windowed --name "Price Editor" ^
    --icon "%~dp0..\assets\icon.ico" ^
    --distpath "%~dp0." --workpath "%~dp0_build" --specpath "%~dp0_build" ^
    price_editor.py
echo.
if exist "Price Editor.exe" (
    echo Done. "Price Editor.exe" is ready in this folder.
    rmdir /s /q "_build" 2>nul
    rmdir /s /q "__pycache__" 2>nul
) else (
    echo Build failed - check the messages above.
)
pause
