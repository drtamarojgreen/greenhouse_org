@echo off

REM --- Install Python Selenium package ---
pip install selenium

REM --- Download and setup GeckoDriver for Firefox ---

REM Define GeckoDriver version and download URL
SET GECKODRIVER_VERSION=0.33.0
SET GECKODRIVER_URL=https://github.com/mozilla/geckodriver/releases/download/v%GECKODRIVER_VERSION%/geckodriver-v%GECKODRIVER_VERSION%-win64.zip
SET GECKODRIVER_ZIP=geckodriver.zip
SET GECKODRIVER_EXE=geckodriver.exe

REM Check if curl is available, otherwise suggest manual download
where curl >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo WARNING: curl is not found. Please download GeckoDriver manually from:
    echo %GECKODRIVER_URL%
    echo And extract %GECKODRIVER_EXE% into the 'test' directory.
    goto :eof
)

REM Download GeckoDriver
echo Downloading GeckoDriver v%GECKODRIVER_VERSION%...
curl -L %GECKODRIVER_URL% -o %GECKODRIVER_ZIP%

REM Extract GeckoDriver
echo Extracting GeckoDriver...
REM Windows does not have a built-in 'unzip' or 'tar' for .zip files by default.
REM We'll assume a modern Windows 10/11 with built-in tar or suggest manual unzip.
REM For simplicity, we'll try to use PowerShell's Expand-Archive if available.

powershell -command "Expand-Archive -Path '%GECKODRIVER_ZIP%' -DestinationPath '.' -Force"

IF EXIST %GECKODRIVER_EXE% (
    echo GeckoDriver extracted successfully.
) ELSE (
    echo.
    echo ERROR: Failed to extract GeckoDriver. Please extract %GECKODRIVER_ZIP% manually.
    echo Make sure %GECKODRIVER_EXE% is in the 'test' directory.
    goto :eof
)

REM Clean up zip file
del %GECKODRIVER_ZIP%

echo Test environment setup complete.

REM --- Update test_frontend.py to use local geckodriver ---
REM This part would typically be done by the AI directly, but for a batch script,
REM we'd instruct the user or rely on a separate AI action.

REM For now, ensure test_frontend.py looks for geckodriver.exe in the same directory.
REM The test_frontend.py script already uses os.path.abspath(__file__) to find its own directory,
REM so placing geckodriver.exe in the 'test' directory is sufficient.

