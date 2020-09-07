import { PubSub } from "apollo-server-express";
import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";

export const METADATA_RECEIVED = "METADATA_RECEIVED";

export const pubsub = process.env.REDIS_URL
  ? new RedisPubSub({
      publisher: new Redis(process.env.REDIS_URL),
      subscriber: new Redis(process.env.REDIS_URL),
    })
  : new PubSub();
