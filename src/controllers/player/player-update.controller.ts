import { Player } from "@prisma/client";
import { Player as jsPlayer } from "oldschooljs";
import { AccountType } from "oldschooljs/dist/meta/types";

import { prisma } from "../../index";
import { getType } from "../../util/gamemode";
import { fetchHiscore } from "./player.controller";

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

  if (gainedSkillXp(newHiscore, user) || gainedBossScore(newHiscore, user)) {
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

const gainedBossScore = (newHiscore: jsPlayer, user: Player) => {
  let k: keyof typeof newHiscore.bossRecords;
  for (k in newHiscore.bossRecords) {
    if (user.hiscore.bosses[k].score !== newHiscore.bossRecords[k].score) {
      return true;
    }
  }

  // no new bosses killed
  return false;
};

const gainedSkillXp = (newHiscore: jsPlayer, user: Player) => {
  return newHiscore.skills.overall.xp > user.hiscore.skills.overall.xp;
};

// does not include snapshots
const updateAccountTypeController = async (username: string) => {
  const accountType = (await getType(username)) as AccountType;
  let user;
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
    return Promise.reject(err);
  }

  return user;
};

export { updateAccountTypeController, updatePlayerByName };
