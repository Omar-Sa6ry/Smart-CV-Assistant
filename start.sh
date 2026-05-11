#!/bin/bash

# Start the Python FastAPI engine in the background
echo "Starting Python Analysis Engine on port 8000..."
cd /usr/src/app/data_analysis
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Start the Node.js API
echo "Starting Node.js API on port ${PORT:-7860}..."
cd /usr/src/app/api
# Run migrations if needed (optional, but good for first run)
# npx prisma migrate deploy 
node dist/main
