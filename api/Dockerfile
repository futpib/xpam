FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn --frozen-lockfile

COPY . /app/

RUN yarn build

FROM node:18-alpine

RUN apk update \
	&& apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/yarn.lock /app/
COPY --from=builder /app/dist/ /app/dist/
COPY --from=builder /app/node_modules/ /app/node_modules/

USER node

EXPOSE 3000

ENV PORT 3000

CMD ["node", "dist/main.js"]
