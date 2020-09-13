import { verify } from "jsonwebtoken";
import { Context } from "./context";
import { URL } from "url";

interface Token {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
}

export const APP_SECRET = process.env.APP_SECRET || "secret";

export function getUserFromSubscription({
  Authorization,
}: {
  Authorization: string;
}) {
  if (Authorization) {
    const token = Authorization.replace("Bearer ", "");
    const verifiedToken = verify(token, APP_SECRET) as Token;
    return verifiedToken && verifiedToken.id;
  }
}

export function getUserId(context: Context) {
  const Authorization = context.req.get("Authorization");

  if (Authorization) {
    const token = Authorization.replace("Bearer ", "");
    const verifiedToken = verify(token, APP_SECRET) as Token;
    return verifiedToken && verifiedToken.id;
  }
}

export function isAdmin(context: Context) {
  const Authorization = context.req.get("Authorization");

  if (Authorization) {
    const token = Authorization.replace("Bearer ", "");
    const verifiedToken = verify(token, APP_SECRET) as Token;
    return verifiedToken && verifiedToken.role === "ADMIN";
  }

  return false;
}

export function parseRedisConf(url: string | undefined) {
  if (url) {
    const parsedURL = new URL(url);
    return {
      host: parsedURL.hostname || "127.0.0.1",
      port: Number(parsedURL.port || 6379),
      username: parsedURL.username
        ? decodeURIComponent(parsedURL.username)
        : undefined,
      password: parsedURL.password
        ? decodeURIComponent(parsedURL.password)
        : undefined,
    };
  } else {
    return undefined;
  }
}
