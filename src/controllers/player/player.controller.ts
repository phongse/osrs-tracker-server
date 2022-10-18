import { NextFunction, Request, Response } from "express";
import { Player, PrismaClient } from "@prisma/client";
import { Player as jsPlayer, Hiscores } from "oldschooljs";
import { AccountType } from "oldschooljs/dist/meta/types";

import { ONE_MINUTE_IN_MS } from "../../util/constants";
import { getType } from "../../util/gamemode";

const prisma = new PrismaClient();

const createNewUser = async (username: string, newHiscore: jsPlayer) => {
  const accountType = await getType(username);

  try {
    const newUser = await prisma.player.create({
      data: {
        username: username,
        accountType,
        combatLevel: newHiscore.combatLevel,
        hiscore: {
          skills: { ...newHiscore.skills },
          bosses: { ...newHiscore.bossRecords },
        },
        snapshots: {
          create: {
            hiscore: {
              skills: { ...newHiscore.skills },
              bosses: { ...newHiscore.bossRecords },
            },
          },
        },
      },
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
    return newUser;
  } catch (err) {
    return Promise.reject(err);
  }
};

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

const addNewPlayerByName = async (username: string): Promise<Player> => {
  let newUser;
  let newHiscore;

  const accountType = await getType(username);

  try {
    newHiscore = await fetchHiscore(username, accountType);
  } catch (err) {
    return Promise.reject(err);
  }

  try {
    newUser = await createNewUser(username, newHiscore);
  } catch (err) {
    return Promise.reject(err);
  }

  return newUser;
};

const newBossScore = (newHiscore: jsPlayer, user: Player) => {
  let k: keyof typeof newHiscore.bossRecords;
  for (k in newHiscore.bossRecords) {
    if (user.hiscore.bosses[k].score !== newHiscore.bossRecords[k].score) {
      return true;
    }
  }

  // no new bosses killed
  return false;
};

const updatePlayerByName = async (
  username: string,
  user: Player
): Promise<Player | undefined> => {
  let currentDate = new Date();
  let newHiscore;
  let updatedUser;

  const accountType = user.accountType as AccountType;

  try {
    newHiscore = await fetchHiscore(username, accountType);
    updatedUser = await prisma.player.update({
      where: {
        username: username,
      },
      data: {
        lastFetch: currentDate,
      },
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
    return Promise.reject(err);
  }

  if (
    newHiscore.skills.overall.xp > user.hiscore.skills.overall.xp ||
    newBossScore(newHiscore, user)
  ) {
    // Player have gained xp or killed a boss since last fetch
    console.log("Player got xp");
    updatedUser = await prisma.player.update({
      where: {
        username: username,
      },
      data: {
        lastChange: currentDate,
        hiscore: {
          skills: { ...newHiscore.skills },
          bosses: { ...newHiscore.bossRecords },
        },
        snapshots: {
          create: {
            hiscore: {
              skills: { ...newHiscore.skills },
              bosses: { ...newHiscore.bossRecords },
            },
          },
        },
      },
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
    return updatedUser;
  }

  return updatedUser;
};

export const getPlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
export const updateAccountType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let user;
  const username = req.params.username;
  const accountType = (await getType(username)) as AccountType;
  try {
    user = await prisma.player.update({
      where: {
        username: username,
      },
      data: {
        accountType,
      },
    });
  } catch (err) {
    return next(err);
  }

  res.json({ user: user });
};
