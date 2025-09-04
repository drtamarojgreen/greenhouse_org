#!/bin/bash

# --- Install Python Selenium package ---
pip install selenium

# --- Download and setup GeckoDriver for Firefox ---

# Define GeckoDriver version and download URL
GECKODRIVER_VERSION="0.33.0"
GECKODRIVER_URL="https://github.com/mozilla/geckodriver/releases/download/v${GECKODRIVER_VERSION}/geckodriver-v${GECKODRIVER_VERSION}-linux64.tar.gz"
GECKODRIVER_TAR="geckodriver.tar.gz"
GECKODRIVER_EXE="geckodriver"

# Download GeckoDriver
echo "Downloading GeckoDriver v${GECKODRIVER_VERSION}..."
curl -L "${GECKODRIVER_URL}" -o "${GECKODRIVER_TAR}"

# Extract GeckoDriver
echo "Extracting GeckoDriver..."
tar -xvzf "${GECKODRIVER_TAR}"

# Make executable and move to current directory
chmod +x "${GECKODRIVER_EXE}"

# Clean up tar file
rm "${GECKODRIVER_TAR}"

echo "Test environment setup complete."

# --- Update test_frontend.py to use local geckodriver ---
# The test_frontend.py script already uses os.path.abspath(__file__) to find its own directory,
# so placing geckodriver in the 'test' directory is sufficient.
