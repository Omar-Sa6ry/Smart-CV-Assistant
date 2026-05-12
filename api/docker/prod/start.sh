#!/bin/bash

# Start the Python FastAPI engine in the background
echo "Starting Python Analysis Engine on port 8000..."
cd /usr/src/app/data_analysis
uvicorn main:app --host 0.0.0.0 --port 8000 2>&1 &

# Check for DATABASE_URL and REDIS_HOST
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set."
  exit 1
fi

if [ -z "$REDIS_HOST" ]; then
  echo "WARNING: REDIS_HOST is not set. Defaulting to localhost (might fail)."
fi

# Run database migrations
echo "Running database migrations..."
cd /usr/src/app/api
# Using db push instead of migrate deploy because the database already has the schema
# but lacks migration history, which causes errors with existing types like 'EmploymentType'.
npx prisma db push --accept-data-loss 2>&1

# Start the Node.js API
echo "Starting Node.js API on port ${PORT:-4003}..."
npm run start:prod
