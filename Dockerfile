FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm ci
RUN npm run build

ENV MONKCLI_ENGINE_DATA_DIR=/app/engine-data
ENV MONKCLI_DATA_DIR=/data
ENV MONKCLI_CONFIG_DIR=/data

CMD ["node", "./bin/monkcli.mjs"]
