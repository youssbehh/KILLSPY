# ---- Build: compile TypeScript and generate the Prisma client ----
FROM node:22-alpine AS build
WORKDIR /api
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate && npm run build

# ---- Runtime: production dependencies + compiled output only ----
FROM node:22-alpine
WORKDIR /api
ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY prisma ./prisma
COPY --from=build /api/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /api/build ./build

USER node
EXPOSE 4000
CMD ["node", "build/index.js"]
