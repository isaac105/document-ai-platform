FROM node:23-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev=false

COPY tsconfig*.json nest-cli.json ./
COPY src ./src

RUN npm run build

FROM node:23-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist
COPY public ./public

EXPOSE 3000

CMD ["node", "dist/main.js"]
