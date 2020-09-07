import { withFilter, PubSub } from "apollo-server-express";
import stations from "./stations";
import { pubsub, METADATA_RECEIVED } from "./pubsub";
import { stats } from "./stream";

const resolvers = {
  Station: {
    url: ({ id }: { id: string }) => `http://localhost:8000/stream/${id}`,
  },
  StreamStatus: {},
  Query: {
    stations: () => stations,
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