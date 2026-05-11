#!/bin/bash

# Start Python FastAPI service in the background
echo "Starting Analysis Service..."
cd /usr/src/app/data_analysis
python3 main.py &

# Wait a bit for the analysis service to start
sleep 5

# Start NestJS API
echo "Starting NestJS API..."
cd /usr/src/app/api
node dist/src/main.js
