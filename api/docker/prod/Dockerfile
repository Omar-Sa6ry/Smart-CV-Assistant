# Stage 1: Build
FROM node:22.13.1-slim AS builder

RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY api/package*.json ./api/
RUN cd api && npm install --legacy-peer-deps

COPY . .

RUN cd api && npx prisma generate
RUN cd api && npm run build

# Stage 2: Production
FROM node:22.13.1-slim

RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/api/package*.json ./api/
COPY --from=builder /usr/src/app/api/node_modules ./api/node_modules
COPY --from=builder /usr/src/app/api/dist ./api/dist
COPY --from=builder /usr/src/app/api/prisma ./api/prisma


EXPOSE 7860

WORKDIR /usr/src/app/api

CMD ["node", "dist/main"]
