FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY worker.mjs ./worker.mjs

ENV NODE_ENV=production
EXPOSE 8080
USER node
CMD ["node", "worker.mjs"]
