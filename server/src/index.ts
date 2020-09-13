import express from "express";
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { applyMiddleware } from "graphql-middleware";
import { RedisCache } from "apollo-server-cache-redis";
import responseCachePlugin from "apollo-server-plugin-response-cache";
import { ApolloServer, makeExecutableSchema } from "apollo-server-express";

import typeDefs from "./schema";
import resolvers from "./resolvers";
import permissions from "./permissions";
import { parseRedisConf } from "./utils";
import { createContext } from "./context";
import stream, { initStreams } from "./stream";

const schema = makeExecutableSchema({ typeDefs, resolvers });
const schemaWithMiddleware = applyMiddleware(schema, permissions);

const redisConf = parseRedisConf(process.env.REDIS_URL);
const cache = redisConf ? new RedisCache(redisConf) : undefined;

const app = express();
const port = process.env.PORT || 8000;
const server = new ApolloServer({
  schema: schemaWithMiddleware,
  subscriptions: {
    path: "/subscriptions",
  },
  context: createContext,
  cache,
  plugins: [
    responseCachePlugin({
      cache,
      sessionId: (requestContext) => {
        const token = requestContext?.request?.http?.headers?.get(
          "Authorization"
        );
        return token || null;
      },
    }),
  ],
});

server.applyMiddleware({ app });

// create an http server for websockets
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

app.get("/stream/:id", stream);

initStreams().then(() => {
  httpServer.listen(port, () => {
    console.log(
      `Server ready at http://localhost:${port}${server.graphqlPath}`
    );
    console.log(
      `Subscriptions ready at ws://localhost:${port}${server.subscriptionsPath}`
    );
    initStreams();
  });
});
