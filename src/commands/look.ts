import cmds from "../api/cmds";
import db, { DBObj } from "../api/database";
import mu from "../api/mu";
import flags from "../api/flags";

export default () => {
  cmds.add({
    name: "Look",
    pattern: /[look]+?\s?(.*)?/,
    flags: "connected",
    exec: async (id: string, args: string[]) => {
      // Check to see if the enactor can see the target.
      const canSee = (en: DBObj, tar: DBObj) => {
        if (flags.hasFlags(tar, "dark")) {
          if (
            (flags.canEdit(en, tar) || tar.owner === en.id) &&
            (en.location === tar.location ||
              en.location === tar.id ||
              tar.location === en.id)
          ) {
            return true;
          } else {
            return false;
          }
        } else if (
          en.location === tar.location ||
          en.location === tar.id ||
          tar.location === en.id
        ) {
          return true;
        } else {
          return false;
        }
      };

      // Get the enactor
      const en = mu.connMap.get(id);
      let tar;
      // Find the first DBO with the name or ID or target.
      if (args[2] === "here") {
        tar = await db.get({ id: en!.location });
      } else if (args[2] === "me") {
        tar = en!;
      } else if (!args[2]) {
        tar = await db.get({ id: en?.location });
      } else {
        tar = await db.get({
          $where: function() {
            this.name.toLowerCase() === args[2]?.toLowerCase() ||
              this.id === args[2];
          }
        });
      }

      if (canSee(en!, tar)) {
        return `**${tar.name}**\n\n${tar.desc}`;
      } else {
        return "I can't find that here.";
      }
    }
  });
};
