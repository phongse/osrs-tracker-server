import express from "express";

import {
  getPlayer,
  updateAccountType,
} from "../controllers/player/player.controller";

let playerRouter = express.Router();

playerRouter.get("/:username", getPlayer);
playerRouter.get("/:username/updatetype", updateAccountType);

export default playerRouter;
