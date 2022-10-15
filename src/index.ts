import * as dotenv from "dotenv";
dotenv.config();
import express from "express";

import playerRouter from "./routes/player.router";

const app = express();

app.use(express.json());

app.use("/player", playerRouter);

const server = app.listen(process.env.SERVER_PORT, () =>
  console.log(`
🚀 Server ready at: http://localhost:${process.env.SERVER_PORT}`)
);
