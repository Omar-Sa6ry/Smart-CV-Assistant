#!/bin/bash

# Start Python FastAPI service in the background
echo "Starting Analysis Service with Uvicorn..."
cd /usr/src/app/data_analysis
export PYTHONPATH=$PYTHONPATH:/usr/src/app

# Run uvicorn using the venv python
/usr/src/app/venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > /usr/src/app/python_service.log 2>&1 &

# Wait for the service to be ready
echo "Waiting for Analysis Service to start..."
MAX_RETRIES=60
COUNT=0
while ! curl -s http://localhost:8000/ > /dev/null; do
    sleep 2
    COUNT=$((COUNT+1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo "Analysis Service failed to start after 2 minutes. Logs:"
        cat /usr/src/app/python_service.log
        break
    fi
done

if curl -s http://localhost:8000/ > /dev/null; then
    echo "Analysis Service is UP and healthy!"
else
    echo "Analysis Service is NOT responding, but proceeding to start API anyway..."
fi

# Start NestJS API
echo "Starting NestJS API..."
cd /usr/src/app/api
node dist/src/main.js
