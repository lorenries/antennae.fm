import { PrismaClient } from "@prisma/client";
import { Request } from "express";

export const prisma = new PrismaClient();

export interface Context {
  prisma: PrismaClient;
  req: Request;
}

export function createContext({ req }: { req: Request }) {
  return {
    req,
    prisma,
  };
}
