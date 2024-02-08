#!/bin/sh

# 1) Create a production-optimized output
#
# Ideally this would happen in `Dockerfile` when creating the image, but because our output depends on `config.js`,
# which is provided during runtime, we have to (re-)build the app every time we're booting the container.
# @TODO: This should be improved at some point in the future.
npm run build

# 2) Run the Next.js server
#
# Using exec + node instead of `npm run start` to correctly forward SIGINT exit signals when stopping the Docker container
# (via https://hynek.me/articles/docker-signals/)
exec node node_modules/.bin/next start
