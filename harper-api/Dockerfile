FROM node:20-slim

# Install Chromium dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libgbm1 \
  libasound2 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY dist/ ./dist/
COPY src/templates/ ./dist/templates/

EXPOSE 8080
ENV PORT=8080

CMD ["node", "dist/index.js"]
