FROM node:18-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json yarn.lock /usr/src/app/
RUN yarn

COPY . /usr/src/app

CMD if [ "${NODE_ENV}" = production ]; then yarn start; else yarn dev; fi
