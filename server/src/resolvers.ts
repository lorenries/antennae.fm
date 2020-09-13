import { withFilter, PubSub } from "apollo-server-express";
import { compare, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";

import { prisma } from "./context";
import { getUserId } from "./utils";
import stations from "./stations";
import { pubsub, METADATA_RECEIVED } from "./pubsub";
import { stats } from "./stream";
import { APP_SECRET } from "./utils";

const resolvers = {
  Stream: {
    url: ({ id }: { id: string }) =>
      `${process.env.API_ROOT || "http://localhost:8000"}/stream/${id}`,
    name: async ({ id }: any, _args: any, ctx: any) => {
      const userId = getUserId(ctx);

      if (userId && id) {
        const streamInfo = await prisma.streamInfo.findMany({
          where: {
            userId: Number(userId),
            streamId: Number(id),
          },
        });

        if (streamInfo.length > 1) return streamInfo[0].name;
      }

      return "";
    },
  },
  User: {
    streams: async ({ id }: any) => {
      const streams = await prisma.stream.findMany({
        where: {
          users: {
            some: {
              id,
            },
          },
        },
        include: {
          streamInfo: {
            where: {
              userId: id,
            },
          },
        },
      });

      return streams.map((stream) => ({
        id: stream.id,
        url: stream.url,
        name: stream.streamInfo[0]?.name,
      }));
    },
  },
  Query: {
    streams: async (_parent: any, _args: any, ctx: any, info: any) => {
      const id = getUserId(ctx);

      if (id) {
        info.cacheControl.setCacheHint({ maxAge: 3600, scope: "PRIVATE" });

        const streams = await prisma.stream.findMany({
          where: {
            users: {
              some: {
                id: Number(id),
              },
            },
          },
        });

        return streams;
      }

      return [];
    },
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
  Mutation: {
    signup: async (_parent: any, { username, password }: any) => {
      const hashedPassword = await hash(password, 10);
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: "USER",
        },
      });
      return {
        token: sign({ id: user.id, username: user.username }, APP_SECRET),
        user: {
          username: user.username,
          id: user.id,
          role: user.role,
          streams: [],
        },
      };
    },
    updatePassword: async (_parent: any, { username, password }: any) => {
      const user = await prisma.user.findOne({
        where: {
          username,
        },
      });

      if (!user) {
        throw new Error("nope");
      }

      const hashedPassword = await hash(password, 10);
      const updatedUser = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
        },
      });

      return {
        token: sign({ id: user.id, username: user.username }, APP_SECRET),
        user: {
          id: updatedUser.id,
          role: updatedUser.role,
          username: updatedUser.username,
        },
      };
    },
    login: async (_parent: any, { username, password }: any) => {
      const user = await prisma.user.findOne({
        where: {
          username,
        },
      });

      if (!user) {
        throw new Error("nope");
      }

      const passwordValid = await compare(password, user.password);
      if (!passwordValid) {
        throw new Error("nope");
      }

      return {
        token: sign({ id: user.id, username: user.username }, APP_SECRET),
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };
    },
    addStream: async (_parent: any, { url, name }: any, ctx: any) => {
      const userId = getUserId(ctx);

      const existingStream = await prisma.stream.findOne({
        where: {
          url,
        },
      });

      if (existingStream) {
        const stream = await prisma.stream.update({
          where: {
            id: existingStream.id,
          },
          data: {
            users: {
              connect: {
                id: Number(userId),
              },
            },
            streamInfo: {
              create: {
                name,
                user: {
                  connect: {
                    id: Number(userId),
                  },
                },
              },
            },
          },
        });

        return stream;
      } else {
        const stream = await prisma.stream.create({
          data: {
            url,
            users: {
              connect: {
                id: Number(userId),
              },
            },
            streamInfo: {
              create: {
                name,
                user: {
                  connect: {
                    id: Number(userId),
                  },
                },
              },
            },
          },
        });

        return stream;
      }
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
