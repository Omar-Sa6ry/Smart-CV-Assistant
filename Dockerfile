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

# Install dependencies and Chrome
RUN apt-get update && apt-get install -y \
    openssl \
    libssl-dev \
    wget \
    gnupg \
    --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/api/node_modules ./api/node_modules
COPY --from=builder /usr/src/app/api/dist ./api/dist
COPY --from=builder /usr/src/app/api/prisma ./api/prisma
COPY --from=builder /usr/src/app/api/package*.json ./api/

COPY --from=builder /usr/src/app/api/src/common/translation/locales ./api/src/common/translation/locales

EXPOSE 7860

WORKDIR /usr/src/app/api

CMD ["node", "dist/src/main.js"]
