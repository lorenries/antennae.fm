import { withFilter, PubSub } from "apollo-server-express";
import stations from "./stations";
import { pubsub, METADATA_RECEIVED } from "./pubsub";
import { stats } from "./stream";

const resolvers = {
  Stream: {
    url: ({ id }: { id: string }) =>
      `${process.env.API_ROOT || "http://localhost:8000"}/stream/${id}`,
  },
  StreamStatus: {},
  Query: {
    streams: () => stations,
    stats: () => {
      const { activeConnections, streamStatus } = stats();
      const status = Object.keys(streamStatus).map((key) => ({
        id: streamStatus[key].id,
        status: streamStatus[key].status,
        stream: stations.find(({ id }) => id === streamStatus[key].id),
      }));
      return { activeConnections, streamStatus: status };
    },
  },
  Subscription: {
    metadata: {
      subscribe: withFilter(
        () => (pubsub as PubSub).asyncIterator([METADATA_RECEIVED]),
        (payload, variables) => payload.metadata.id === variables.id
      ),
    },
  },
};

export default resolvers;
