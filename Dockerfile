FROM node:10

RUN mkdir /app
WORKDIR /app

COPY src/package.json ./
COPY src/yarn.lock ./
# ベースイメージのDockerfile見たらyarnを入れてくれている
# https://github.com/nodejs/docker-node/blob/f8c22aeb318ec3df876f8271b9b8a86005f0f53d/10/stretch/Dockerfile
RUN yarn install
COPY src ./

CMD ["yarn", "start"]