import { gql } from "apollo-server-express";

const typeDefs = gql`
  type Stream {
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
    stream: Stream!
    status: Int!
  }

  type StreamStats {
    activeConnections: Int!
    streamStatus: [StreamStatus]!
  }

  type User {
    id: ID!
  }

  type Subscription {
    metadata(id: ID!): StreamMetadata
  }

  type Query {
    streams: [Stream]!
    stats: StreamStats!
  }
`;

export default typeDefs;
