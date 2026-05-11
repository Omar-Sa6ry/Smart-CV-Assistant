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
    echo "DATABASE_URL is found. Injecting into schema for migration..."
    cd /usr/src/app/api
    # Backup schema
    cp prisma/schema.prisma prisma/schema.prisma.bak
    # Inject actual URL into schema file (using ! as delimiter to handle / in URL)
    sed -i "s!url *= *env(\"DATABASE_URL\")!url = \"$DATABASE_URL\"!g" prisma/schema.prisma
    
    echo "Running Migrations with injected URL..."
    npx prisma migrate deploy || npx prisma db push --accept-data-loss || echo "Migration still failing..."
    
    # Restore schema to use env() for the running app
    cp prisma/schema.prisma.bak prisma/schema.prisma
fi

# Start the Node.js API
echo "Starting Node.js API on port ${PORT:-7860}..."
cd /usr/src/app/api
node dist/src/main
