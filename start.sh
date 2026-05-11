#!/bin/bash

# Start the Python Analysis Engine
echo "Starting Python Analysis Engine on port 8000..."
cd /usr/src/app/data_analysis
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Run Database Migrations
echo "--- Environment Debug ---"
echo "Available Environment Variables:"
env | cut -d= -f1 | sort
echo "-------------------------"

echo "Checking Database Environment..."
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is NOT set in Hugging Face Secrets!"
else
    echo "DATABASE_URL is found. Running Migrations..."
    cd /usr/src/app/api
    DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy --schema prisma/schema.prisma || DATABASE_URL="$DATABASE_URL" npx prisma db push --accept-data-loss || echo "Migration totally failed..."
fi

# Start the Node.js API
echo "Starting Node.js API on port ${PORT:-7860}..."
cd /usr/src/app/api
node dist/src/main
