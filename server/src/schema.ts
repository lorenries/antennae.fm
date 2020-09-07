import { gql } from "apollo-server-express";

const typeDefs = gql`
  type Station {
    id: ID!
    name: String!
    url: String!
  }

  type StreamMetadata {
    id: ID!
    title: String
    artist: String
  }

  type StreamStatus {
    id: ID!
    stream: Station!
    status: Int!
  }

  type StreamStats {
    activeConnections: Int!
    streamStatus: [StreamStatus]!
  }

  type Subscription {
    metadata(id: ID!): StreamMetadata
  }

  type Query {
    stations: [Station]!
    stats: StreamStats!
  }
`;

export default typeDefs;
