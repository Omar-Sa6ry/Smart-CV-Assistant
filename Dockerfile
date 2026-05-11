# Stage 1: Build Node
FROM node:22.13.1-slim AS node-builder
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/app
COPY api/package*.json ./api/
RUN cd api && npm install --legacy-peer-deps
COPY api ./api
RUN cd api && npx prisma generate && npm run build

# Stage 2: Final Production Image
FROM node:22.13.1-slim

# Install system dependencies (OpenSSL, Python, and Puppeteer/Chromium deps)
RUN apt-get update && apt-get install -y \
    openssl \
    libssl-dev \
    python3 \
    python3-pip \
    python3-venv \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy Node.js build artifacts
COPY --from=node-builder /usr/src/app/api/package*.json ./api/
COPY --from=node-builder /usr/src/app/api/node_modules ./api/node_modules
COPY --from=node-builder /usr/src/app/api/dist ./api/dist
COPY --from=node-builder /usr/src/app/api/prisma ./api/prisma

# Copy Python Analysis Engine and Models
COPY data_analysis ./data_analysis
COPY ai_models ./ai_models

# Install Python dependencies
RUN pip3 install --no-cache-dir -r data_analysis/requirements.txt --break-system-packages

# Copy and setup start script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Use existing node user (UID 1000) for Hugging Face
RUN chown -R node:node /usr/src/app
USER node

ENV PORT=7860
EXPOSE 7860

# Use absolute path for start script
CMD ["/usr/src/app/start.sh"]
