#!/bin/bash

# Start the Python Analysis Engine
echo "Starting Python Analysis Engine on port 8000..."
cd /usr/src/app/data_analysis
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Run Database Migrations
echo "Checking Database Environment..."
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set in environment variables!"
else
    echo "DATABASE_URL is found. Running Migrations..."
    cd /usr/src/app/api && npx prisma migrate deploy || echo "Migration failed, but starting server anyway..."
fi

# Start the Node.js API
echo "Starting Node.js API on port ${PORT:-7860}..."
cd /usr/src/app/api
node dist/src/main
