import { verify } from "jsonwebtoken";
import { Context } from "./context";

interface Token {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
}

export const APP_SECRET = process.env.APP_SECRET || "secret";

export function atob(str: string) {
  return Buffer.from(str, "base64").toString("binary");
}

export function btoa(str: string) {
  return Buffer.from(str, "binary").toString("base64");
}

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
