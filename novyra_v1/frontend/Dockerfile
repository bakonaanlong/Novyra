# Build stage
FROM node:20-slim AS build
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# VITE_API_BASE must be supplied at BUILD time (Vite inlines env vars into
# the static bundle) — pass it as a build arg pointing at your deployed
# backend's public URL, e.g.:
#   docker build --build-arg VITE_API_BASE=https://smart-farm-backend.fly.dev .
ARG VITE_API_BASE=http://localhost:8000
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

# Serve stage
FROM node:20-slim
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/dist ./dist

# Fly.io and Railway both inject $PORT; default to 4173 for local runs.
ENV PORT=4173
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]
