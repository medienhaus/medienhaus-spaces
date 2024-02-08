# syntax=docker/dockerfile:1
# Mostly taken from https://github.com/vercel/next.js/blob/0114c2cb24c3b146ac323d6e015a3dc3dbee2e65/examples/with-docker-compose/README.md

FROM node:lts-alpine AS base


# Step 1. Install dependencies
FROM base AS dependency-installer

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm clean-install



# Step 2a. Development image
FROM dependency-installer AS development-runner

WORKDIR /app

# Environment variables must be present at build time
# https://github.com/vercel/next.js/discussions/14030
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED=1


COPY . .

EXPOSE 3000
# To correctly forward SIGINT exit signals we're calling the full `node` path instead of `npm run dev`;
# Arguments from https://github.com/vercel/next.js/blob/d21025cc3a50e2ff8a7137d5d5c94576218f01e7/package.json#L50
CMD ["node", "--trace-deprecation", "--enable-source-maps", "node_modules/.bin/next"]



# Step 2b. Production image, copy all the files and run next
FROM dependency-installer AS production-runner

WORKDIR /app

# Environment variables must be redefined at run time
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED=1


COPY . .

EXPOSE 3000
ENTRYPOINT ["/app/Docker.prod.entrypoint.sh"]
