import { gql } from "apollo-server-express";

const typeDefs = gql`
  type Stream {
    id: ID!
    url: String!
    name: String
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
    username: String!
    streams: [Stream]!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Subscription {
    metadata(id: ID!): StreamMetadata
  }

  type Query {
    streams: [Stream]!
    stats: StreamStats!
  }

  type Mutation {
    signup(username: String!, password: String!): AuthPayload
    login(username: String!, password: String!): AuthPayload
    updatePassword(username: String!, password: String!): AuthPayload
    addStream(url: String!, name: String!): Stream
  }
`;

export default typeDefs;
