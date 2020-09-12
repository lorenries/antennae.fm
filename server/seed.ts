import { PrismaClient } from "@prisma/client";
import { btoa, atob } from "./src/utils";
import stations from "./src/stations";

const prisma = new PrismaClient();

async function main() {
  const streamInfo = await prisma.streamInfo.findOne({
    where: {
      userId: 1,
      streamId: 1,
    },
  });

  console.dir(streamInfo);
}

main()
  .catch((e) => {
    throw e;
  })
  .then(async () => {
    await prisma.$disconnect();
  });
