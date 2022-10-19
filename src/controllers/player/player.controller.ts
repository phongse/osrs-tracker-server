import { NextFunction, Request, Response } from "express";
import { Hiscores } from "oldschooljs";
import { AccountType } from "oldschooljs/dist/meta/types";

import { prisma } from "../../index";
import { ONE_MINUTE_IN_MS } from "../../util/constants";
import { addNewPlayerByName } from "./player-new.controller";
import {
  updateAccountTypeController,
  updatePlayerByName,
} from "./player-update.controller";

const fetchHiscore = async (username: string, type: AccountType) => {
  try {
    const newHiscore = await Hiscores.fetch(username, {
      virtualLevels: true,
      type,
    });
    return newHiscore;
  } catch (err) {
    return Promise.reject(err);
  }
};

const getPlayer = async (req: Request, res: Response, next: NextFunction) => {
  const username = req.params.username;
  let user;

  try {
    user = await prisma.player.findUnique({
      where: { username: username },
      include: {
        snapshots: {
          select: {
            id: false,
            playerId: false,
            importDate: true,
            hiscore: true,
          },
        },
      },
    });
  } catch (err) {
    res.status(500);
    return next(err);
  }

  if (!user) {
    let newPlayer;
    try {
      newPlayer = await addNewPlayerByName(username);
    } catch (err) {
      res.status(500);
      return next(err);
    }

    user = newPlayer;
  }

  // Fetch update if more than 5 minutes since last
  if (
    user &&
    new Date().getTime() - user.lastFetch.getTime() > ONE_MINUTE_IN_MS * 5
  ) {
    let updatedUser;
    try {
      updatedUser = await updatePlayerByName(username, user);
    } catch (err) {
      res.status(500);
      return next(err);
    }

    user = updatedUser ?? user;
  }

  res.json({ user: user });
};

// does not include snapshots
const updateAccountType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let user;
  const username = req.params.username;
  try {
    user = await updateAccountTypeController(username);
  } catch (err) {
    return next(err);
  }

  res.json({ user: user });
};

export { fetchHiscore, getPlayer, updateAccountType };
