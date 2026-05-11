# Stage 1: Build
FROM node:22.13.1-slim AS builder

RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY . .

RUN npm install --legacy-peer-deps
RUN cd api && npm install --legacy-peer-deps

RUN cd api && npx prisma generate
RUN cd api && npm run build

# Stage 2: Production
FROM node:22.13.1-slim

# Install dependencies, Chromium, and Python
RUN apt-get update && apt-get install -y \
    openssl \
    libssl-dev \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    python3 \
    python3-pip \
    python3-venv \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /usr/src/app

# Copy node modules and built API
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/api/node_modules ./api/node_modules
COPY --from=builder /usr/src/app/api/dist ./api/dist
COPY --from=builder /usr/src/app/api/prisma ./api/prisma
COPY --from=builder /usr/src/app/api/package*.json ./api/
COPY --from=builder /usr/src/app/api/src/common/translation/locales ./api/src/common/translation/locales

# Copy Data Analysis and AI Models
COPY --from=builder /usr/src/app/data_analysis ./data_analysis
COPY --from=builder /usr/src/app/ai_models ./ai_models

# Install Python requirements
RUN pip3 install --no-cache-dir --break-system-packages -r data_analysis/requirements.txt

# Copy and setup start script
COPY start.sh .
RUN chmod +x start.sh

EXPOSE 7860

CMD ["./start.sh"]

