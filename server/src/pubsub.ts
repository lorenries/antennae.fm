import { PubSub } from "apollo-server-express";
import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis, { RedisOptions } from "ioredis";

export const METADATA_RECEIVED = "METADATA_RECEIVED";

const options: RedisOptions = {
  host: process.env.REDIS_HOST || "",
  port: 6379,
  retryStrategy: (times) => {
    // reconnect after
    return Math.min(times * 50, 2000);
  },
};

export const pubsub = process.env.REDIS_HOST
  ? new RedisPubSub({
      publisher: new Redis(options),
      subscriber: new Redis(options),
    })
  : new PubSub();
