# Web build of the Expo app, served as static files.
# (Native iOS/Android builds go through EAS, not Docker.)

# ---- Build: static web export ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# EXPO_PUBLIC_* variables are inlined at build time.
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
RUN npm run build:web

# ---- Runtime: nginx ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
