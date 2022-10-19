import * as dotenv from "dotenv";
dotenv.config();
import { PrismaClient } from "@prisma/client";
import express from "express";
import { exit } from "process";

import playerRouter from "./routes/player.router";

if (!process.env.DATABASE_URL) {
  console.log("Define DATABASE_URL in .env");
  exit(1);
}

export const prisma = new PrismaClient();

const app = express();

app.use(express.json());

app.use("/player", playerRouter);

const port = process.env.SERVER_PORT || 3000;

const server = app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}`)
);
