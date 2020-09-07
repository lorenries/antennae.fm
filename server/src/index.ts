import express from "express";
import http from "http";
import { ApolloServer } from "apollo-server-express";

import typeDefs from "./schema";
import resolvers from "./resolvers";
import stream, { initStreams } from "./stream";

const app = express();
const port = process.env.PORT || 8000;
const server = new ApolloServer({
  typeDefs,
  resolvers,
  subscriptions: {
    path: "/subscriptions",
  },
});

server.applyMiddleware({ app });

// create an http server for websockets
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

app.get("/stream/:id", stream);

httpServer.listen(port, () => {
  console.log(`Server ready at http://localhost:${port}${server.graphqlPath}`);
  console.log(
    `Subscriptions ready at ws://localhost:${port}${server.subscriptionsPath}`
  );
  initStreams();
});
