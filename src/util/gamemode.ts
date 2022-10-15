import { Hiscores } from "oldschooljs";
import { AccountType } from "oldschooljs/dist/meta/types";

export const getType = async (username: string) => {
  const regular = await getOverallXp(username, AccountType.Normal);

  if (!regular) {
    throw new Error(`Failed to load hiscores for ${username}.`);
  }

  const ironman = await getOverallXp(username, AccountType.Ironman);
  if (!ironman || ironman < regular) return AccountType.Normal;

  const hardcore = await getOverallXp(username, AccountType.Hardcore);
  if (hardcore && hardcore >= ironman) return AccountType.Hardcore;

  const ultimate = await getOverallXp(username, AccountType.Ultimate);
  if (ultimate && ultimate >= ironman) return AccountType.Ultimate;

  return AccountType.Ironman;
};

const getOverallXp = async (
  username: string,
  type: AccountType
): Promise<number | undefined> => {
  try {
    const hiscore = await Hiscores.fetch(username, {
      type,
    });
    const overall = hiscore.skills.overall.xp;
    return overall;
  } catch (err) {
    return undefined;
  }
};
