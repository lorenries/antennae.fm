import express from "express";
import http from "http";
import { ApolloServer, makeExecutableSchema } from "apollo-server-express";
import { applyMiddleware } from "graphql-middleware";
import dotenv from "dotenv";
dotenv.config();

import typeDefs from "./schema";
import resolvers from "./resolvers";
import permissions from "./permissions";
import { createContext } from "./context";
import stream, { initStreams } from "./stream";
import { getUserFromSubscription } from "./utils";

const schema = makeExecutableSchema({ typeDefs, resolvers });
const schemaWithMiddleware = applyMiddleware(schema, permissions);

const app = express();
const port = process.env.PORT || 8000;
const server = new ApolloServer({
  schema: schemaWithMiddleware,
  subscriptions: {
    path: "/subscriptions",
    onConnect: (...args) => {
      // const userId = getUserFromSubscription(
      //   connectionParams as { Authorization: string }
      // );

      // if (Boolean(userId)) {
      //   return connectionParams;
      // } else {
      //   throw new Error("Not Authorised!")
      // }
      console.log(args);
    },
  },
  context: createContext,
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
