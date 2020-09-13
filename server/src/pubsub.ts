import { PubSub } from "apollo-server-express";
import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";

import { parseRedisConf } from "./utils";

export const METADATA_RECEIVED = "METADATA_RECEIVED";

const redisConf = parseRedisConf(process.env.REDIS_URL);

export const pubsub = redisConf
  ? new RedisPubSub({
      publisher: new Redis(redisConf),
      subscriber: new Redis(redisConf),
    })
  : new PubSub();
