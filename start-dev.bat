@echo off
setlocal

echo ===============================================================
echo        Local AI Video Studio (Veyra) - Desktop Studio
echo ===============================================================

REM Ensure local Cargo and MinGW tools are available in PATH
set "PATH=%USERPROFILE%\.cargo\bin;%USERPROFILE%\w64devkit\bin;%PATH%"

REM Check for virtual environment python
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

echo [LAUNCHER] Using Python runtime: %PYTHON_EXE%
echo [LAUNCHER] Starting dev orchestrator...

%PYTHON_EXE% scripts\dev.py %*

endlocal
