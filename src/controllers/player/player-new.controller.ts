import { Player } from "@prisma/client";
import { Player as jsPlayer } from "oldschooljs";

import { prisma } from "../../index";
import { getType } from "../../util/gamemode";
import { fetchHiscore } from "./player.controller";

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

export { addNewPlayerByName, createNewUser };
