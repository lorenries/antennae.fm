FROM node:12-alpine as intermediate

RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY package.json yarn.lock ./
ENV NODE_ENV development
RUN yarn --frozen-lockfile

COPY . .

ENV NODE_ENV production
RUN yarn build

FROM node:12-alpine

ENV NODE_ENV production
ENV PORT 8000

RUN mkdir -p /opt/app
RUN chown node:node /opt/app
WORKDIR /opt/app

COPY --chown=node:node --from=intermediate /opt/app .
USER node

EXPOSE 8000

CMD [ "node", "dist/index.js" ]