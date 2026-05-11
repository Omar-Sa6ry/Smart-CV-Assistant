#!/bin/bash

# Start the Python FastAPI engine in the background
echo "Starting Python Analysis Engine on port 8000..."
cd /usr/src/app/data_analysis
uvicorn main:app --host 0.0.0.0 --port 8000 &

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
# We use --skip-generate because we already generated in the Dockerfile
# We pass the URL explicitly to avoid config resolution issues in some environments
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy --schema ./prisma/schema.prisma

# Start the Node.js API
echo "Starting Node.js API on port ${PORT:-4003}..."
npm run start:prod
