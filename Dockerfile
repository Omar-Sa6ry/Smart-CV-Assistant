# Stage 1: Build
FROM node:22.13.1-slim AS builder

RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY . .

# تثبيت الاعتمادات في الـ Root وفي الـ API لضمان وجود كل شيء
RUN npm install --legacy-peer-deps
RUN cd api && npm install --legacy-peer-deps

# تشغيل Prisma Generate و Build
RUN cd api && npx prisma generate
RUN cd api && npm run build

# Stage 2: Production
FROM node:22.13.1-slim

RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# نسخ الاعتمادات والملفات
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/api/node_modules ./api/node_modules
COPY --from=builder /usr/src/app/api/dist ./api/dist
COPY --from=builder /usr/src/app/api/prisma ./api/prisma
COPY --from=builder /usr/src/app/api/package*.json ./api/

# نسخ ملفات الترجمة والـ templates الضرورية
COPY --from=builder /usr/src/app/api/src/common/translation/locales ./api/src/common/translation/locales

EXPOSE 7860

WORKDIR /usr/src/app/api

CMD ["node", "dist/src/main.js"]
