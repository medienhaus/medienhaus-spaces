# syntax=docker/dockerfile:1
# Taken with a pinch of salt from https://github.com/vercel/next.js/blob/524b31513a58e58e15862ac8aa3f27da8a47a267/examples/with-docker-compose/next-app/prod.Dockerfile

FROM node:lts-alpine AS base


# Step 1. Install dependencies
FROM base AS dependency-installer

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install



# Step 2. Development image
FROM dependency-installer AS development-runner

WORKDIR /app

# Environment variables must be present at build time
# https://github.com/vercel/next.js/discussions/14030
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED=1


EXPOSE 3000
# Taken from https://github.com/vercel/next.js/blob/d21025cc3a50e2ff8a7137d5d5c94576218f01e7/package.json#L50
CMD ["node", "--trace-deprecation", "--enable-source-maps", "node_modules/.bin/next"]



# Step 3. Build a production-optimized version of the app
FROM dependency-installer AS production-builder

WORKDIR /app

# Environment variables must be redefined at run time
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}


COPY . .

# Build Next.js app
RUN npm run build



# Step 4. Production image, copy all the files and run next
FROM base AS production-runner

WORKDIR /app

# Environment variables must be redefined at run time
ARG NODE_ENV
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED=1


# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=production-builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=production-builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=production-builder --chown=nextjs:nodejs /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
