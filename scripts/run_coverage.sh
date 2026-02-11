#!/bin/bash

# MediTrack Test Runner & Coverage Reporter

# Set up environment
export PYTHONPATH=$PYTHONPATH:.
export FLASK_ENV=testing
export FIELD_ENCRYPTION_KEY=${FIELD_ENCRYPTION_KEY:-"RuquevaVRhWn0g0ALL4xevxT9GeJMcoGV-B-LYyMyw0="}
export SECRET_KEY=${SECRET_KEY:-"test-secret-key-at-least-32-chars-long"}
export JWT_SECRET_KEY=${JWT_SECRET_KEY:-"test-jwt-secret-at-least-32-chars-long"}

# Create logs directory for audit trails
mkdir -p logs

echo "Starting MediTrack comprehensive test suite..."
echo "Environment: $FLASK_ENV"

# Run tests with coverage
# We focus on the application/interface/backend directory
# Skipping integration and security hardening tests that require a live database
python3 -m pytest \
    -k "not integration and not SecurityHardening" \
    --cov=application/interface/backend \
    --cov-report=term \
    --cov-report=term:skip-covered \
    tests/application/interface/backend/

echo ""
echo "Test execution complete."
